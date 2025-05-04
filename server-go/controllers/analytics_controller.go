package controllers

import (
	"mentorback/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AnalyticsController handles analytics-related API requests
type AnalyticsController struct {
	BaseController
}

// NewAnalyticsController creates a new analytics controller
func NewAnalyticsController(base BaseController) *AnalyticsController {
	return &AnalyticsController{BaseController: base}
}

// GetUserAnalytics retrieves analytics for the authenticated user
func (ac *AnalyticsController) GetUserAnalytics(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Find analytics data for the user
	var analytics models.Analytics
	result := ac.DB.Where("user_id = ?", userData.ID).First(&analytics)

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve analytics"})
		return
	}

	// If no analytics record exists, create a new one
	if result.Error == gorm.ErrRecordNotFound {
		analytics = models.Analytics{
			UserID:            userData.ID,
			LastActivityDate:  time.Now(),
			TopicsViewed:      0,
			TopicsCompleted:   0,
			TotalLearningTime: 0,
			StreakDays:        0,
		}
		ac.DB.Create(&analytics)
	}

	// Get daily activity for the past 30 days
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	var dailyActivity []models.DailyActivity
	ac.DB.Where("user_id = ? AND date >= ?", userData.ID, thirtyDaysAgo).
		Order("date ASC").
		Find(&dailyActivity)

	// Fill in missing days with zero values
	completeDailyActivity := ac.fillMissingDailyActivity(dailyActivity, userData.ID, thirtyDaysAgo, now)

	// Get top interactions
	var topInteractions []models.TopicInteraction
	ac.DB.Where("user_id = ?", userData.ID).
		Order("view_count DESC").
		Limit(10).
		Find(&topInteractions)

	// Get recent activities
	var recentActivities []models.ActivityLog
	ac.DB.Where("user_id = ?", userData.ID).
		Order("timestamp DESC").
		Limit(15).
		Find(&recentActivities)

	// Create response
	response := models.AnalyticsResponse{
		Analytics:        &analytics,
		DailyActivity:    completeDailyActivity,
		TopInteractions:  topInteractions,
		RecentActivities: recentActivities,
	}

	c.JSON(http.StatusOK, response)
}

// TrackTopicView tracks when a user views a topic
func (ac *AnalyticsController) TrackTopicView(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Parse request
	var request struct {
		Topic     string `json:"topic" binding:"required"`
		TimeSpent int    `json:"timeSpent"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update analytics in a transaction
	err := ac.DB.Transaction(func(tx *gorm.DB) error {
		// Update user analytics
		var analytics models.Analytics
		result := tx.Where("user_id = ?", userData.ID).First(&analytics)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		now := time.Now()

		// If no analytics record exists, create a new one
		if result.Error == gorm.ErrRecordNotFound {
			analytics = models.Analytics{
				UserID:            userData.ID,
				TopicsViewed:      1,
				LastActivityDate:  now,
				LastTopicAccessed: request.Topic,
				TotalLearningTime: request.TimeSpent,
			}
			if err := tx.Create(&analytics).Error; err != nil {
				return err
			}
		} else {
			// Update existing analytics
			analytics.TopicsViewed++
			analytics.LastActivityDate = now
			analytics.LastTopicAccessed = request.Topic
			analytics.TotalLearningTime += request.TimeSpent

			// Update streak if this is a new day
			if analytics.LastActivityDate.Day() != now.Day() {
				analytics.StreakDays++
			}

			if err := tx.Save(&analytics).Error; err != nil {
				return err
			}
		}

		// Update or create topic interaction
		var topicInteraction models.TopicInteraction
		result = tx.Where("user_id = ? AND topic_name = ?", userData.ID, request.Topic).First(&topicInteraction)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		if result.Error == gorm.ErrRecordNotFound {
			// Create new topic interaction
			topicInteraction = models.TopicInteraction{
				UserID:     userData.ID,
				TopicName:  request.Topic,
				ViewCount:  1,
				TimeSpent:  request.TimeSpent,
				LastViewed: now,
			}
			if err := tx.Create(&topicInteraction).Error; err != nil {
				return err
			}
		} else {
			// Update existing topic interaction
			topicInteraction.ViewCount++
			topicInteraction.TimeSpent += request.TimeSpent
			topicInteraction.LastViewed = now

			if err := tx.Save(&topicInteraction).Error; err != nil {
				return err
			}
		}

		// Create activity log
		activityLog := models.ActivityLog{
			UserID:       userData.ID,
			ActivityType: "topic-view",
			Description:  "Viewed topic: " + request.Topic,
			TopicName:    request.Topic,
			TimeSpent:    request.TimeSpent,
			Timestamp:    now,
		}

		if err := tx.Create(&activityLog).Error; err != nil {
			return err
		}

		// Update daily activity
		return ac.updateDailyActivity(tx, userData.ID, 1, 0, request.TimeSpent)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track topic view"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topic view tracked successfully"})
}

// TrackTopicCompletion tracks when a user completes a topic
func (ac *AnalyticsController) TrackTopicCompletion(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Parse request
	var request struct {
		Topic          string  `json:"topic" binding:"required"`
		TimeToComplete int     `json:"timeToComplete"`
		Attempts       int     `json:"attempts"`
		SuccessRate    float64 `json:"successRate"`
		Difficulty     int     `json:"difficulty"`
		QuizScore      float64 `json:"quizScore"`    // Quiz performance score
		CodeScore      float64 `json:"codeScore"`    // Code exercise performance score
		AverageScore   float64 `json:"averageScore"` // Combined average score
		CompletedAt    string  `json:"completedAt"`  // ISO format timestamp when completed
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update analytics in a transaction
	err := ac.DB.Transaction(func(tx *gorm.DB) error {
		// Update user analytics
		var analytics models.Analytics
		result := tx.Where("user_id = ?", userData.ID).First(&analytics)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		now := time.Now()
		completedAt := now
		if request.CompletedAt != "" {
			parsedTime, err := time.Parse(time.RFC3339, request.CompletedAt)
			if err == nil {
				completedAt = parsedTime
			}
		}

		// If no analytics record exists, create a new one
		if result.Error == gorm.ErrRecordNotFound {
			analytics = models.Analytics{
				UserID:              userData.ID,
				TopicsViewed:        1,
				TopicsCompleted:     1,
				LastActivityDate:    now,
				LastTopicAccessed:   request.Topic,
				TotalLearningTime:   request.TimeToComplete,
				AverageQuizScore:    request.SuccessRate,
				AverageCodeScore:    request.CodeScore,
				TopicCompletionRate: 100.0, // First topic means 100% completion rate
			}

			// If quiz score is provided, use it instead of success rate
			if request.QuizScore > 0 {
				analytics.AverageQuizScore = request.QuizScore
			}

			if err := tx.Create(&analytics).Error; err != nil {
				return err
			}
		} else {
			// Update existing analytics
			analytics.TopicsCompleted++
			analytics.LastActivityDate = now
			analytics.LastTopicAccessed = request.Topic
			analytics.TotalLearningTime += request.TimeToComplete

			// Update average quiz score (prefer explicit quiz score if provided)
			scoreToUse := request.SuccessRate
			if request.QuizScore > 0 {
				scoreToUse = request.QuizScore
			}
			analytics.AverageQuizScore = (analytics.AverageQuizScore*float64(analytics.TopicsCompleted-1) + scoreToUse) / float64(analytics.TopicsCompleted)

			// Update average code score if provided
			if request.CodeScore > 0 {
				if analytics.AverageCodeScore == 0 {
					analytics.AverageCodeScore = request.CodeScore
				} else {
					analytics.AverageCodeScore = (analytics.AverageCodeScore*float64(analytics.TopicsCompleted-1) + request.CodeScore) / float64(analytics.TopicsCompleted)
				}
			}

			// Update completion rate
			if analytics.TopicsViewed > 0 {
				analytics.TopicCompletionRate = float64(analytics.TopicsCompleted) / float64(analytics.TopicsViewed) * 100.0
			}

			// Update streak if this is a new day
			if analytics.LastActivityDate.Day() != now.Day() {
				analytics.StreakDays++
			}

			if err := tx.Save(&analytics).Error; err != nil {
				return err
			}
		}

		// Update or create topic interaction
		var topicInteraction models.TopicInteraction
		result = tx.Where("user_id = ? AND topic_name = ?", userData.ID, request.Topic).First(&topicInteraction)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		if result.Error == gorm.ErrRecordNotFound {
			// Create new topic interaction
			topicInteraction = models.TopicInteraction{
				UserID:      userData.ID,
				TopicName:   request.Topic,
				ViewCount:   1,
				TimeSpent:   request.TimeToComplete,
				LastViewed:  now,
				CompletedAt: completedAt,
				Difficulty:  request.Difficulty,
				QuizScore:   request.QuizScore,
				CodeScore:   request.CodeScore,
			}
			if err := tx.Create(&topicInteraction).Error; err != nil {
				return err
			}
		} else {
			// Update existing topic interaction
			topicInteraction.CompletedAt = completedAt
			topicInteraction.TimeSpent += request.TimeToComplete

			// Update difficulty if provided
			if request.Difficulty > 0 {
				topicInteraction.Difficulty = request.Difficulty
			}

			// Update scores if provided
			if request.QuizScore > 0 {
				topicInteraction.QuizScore = request.QuizScore
			}
			if request.CodeScore > 0 {
				topicInteraction.CodeScore = request.CodeScore
			}

			if err := tx.Save(&topicInteraction).Error; err != nil {
				return err
			}
		}

		// Create activity log
		activityLog := models.ActivityLog{
			UserID:       userData.ID,
			ActivityType: "topic-completion",
			Description:  "Completed topic: " + request.Topic,
			TopicName:    request.Topic,
			TimeSpent:    request.TimeToComplete,
			Score:        request.SuccessRate,
			Timestamp:    now,
		}

		if err := tx.Create(&activityLog).Error; err != nil {
			return err
		}

		// Update daily activity
		return ac.updateDailyActivity(tx, userData.ID, 0, 1, request.TimeToComplete)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track topic completion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topic completion tracked successfully"})
}

// TrackExerciseActivity tracks user exercise activity
func (ac *AnalyticsController) TrackExerciseActivity(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Parse request
	var request struct {
		Topic      string  `json:"topic" binding:"required"`
		ExerciseID string  `json:"exerciseId" binding:"required"`
		Completed  bool    `json:"completed"`
		Score      float64 `json:"score"`
		TimeSpent  int     `json:"timeSpent"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update analytics in a transaction
	err := ac.DB.Transaction(func(tx *gorm.DB) error {
		// Update user analytics
		var analytics models.Analytics
		result := tx.Where("user_id = ?", userData.ID).First(&analytics)

		if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
			return result.Error
		}

		now := time.Now()

		// If no analytics record exists, create a new one
		if result.Error == gorm.ErrRecordNotFound {
			analytics = models.Analytics{
				UserID:             userData.ID,
				LastActivityDate:   now,
				LastTopicAccessed:  request.Topic,
				TotalLearningTime:  request.TimeSpent,
				ExercisesAttempted: 1,
			}

			if request.Completed {
				analytics.ExercisesCompleted = 1
				analytics.AverageQuizScore = request.Score
			}

			if err := tx.Create(&analytics).Error; err != nil {
				return err
			}
		} else {
			// Update existing analytics
			analytics.LastActivityDate = now
			analytics.LastTopicAccessed = request.Topic
			analytics.TotalLearningTime += request.TimeSpent
			analytics.ExercisesAttempted++

			if request.Completed {
				analytics.ExercisesCompleted++
				// Update average quiz score
				analytics.AverageQuizScore = (analytics.AverageQuizScore*float64(analytics.ExercisesCompleted-1) + request.Score) / float64(analytics.ExercisesCompleted)
			}

			// Update streak if this is a new day
			if analytics.LastActivityDate.Day() != now.Day() {
				analytics.StreakDays++
			}

			if err := tx.Save(&analytics).Error; err != nil {
				return err
			}
		}

		// Create activity log
		activityType := "exercise-attempt"
		description := "Attempted exercise in topic: " + request.Topic

		if request.Completed {
			activityType = "exercise-completion"
			description = "Completed exercise in topic: " + request.Topic
		}

		activityLog := models.ActivityLog{
			UserID:       userData.ID,
			ActivityType: activityType,
			Description:  description,
			TopicName:    request.Topic,
			ExerciseID:   request.ExerciseID,
			TimeSpent:    request.TimeSpent,
			Score:        request.Score,
			Timestamp:    now,
		}

		if err := tx.Create(&activityLog).Error; err != nil {
			return err
		}

		// Update daily activity
		exercisesDone := 0
		if request.Completed {
			exercisesDone = 1
		}

		return ac.updateDailyActivityWithExercises(tx, userData.ID, 0, 0, request.TimeSpent, exercisesDone)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to track exercise activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exercise activity tracked successfully"})
}

// RateTopic tracks user ratings for topics
func (ac *AnalyticsController) RateTopic(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Parse request
	var request struct {
		Topic  string `json:"topic" binding:"required"`
		Rating int    `json:"rating" binding:"required,min=1,max=5"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update topic interaction
	var topicInteraction models.TopicInteraction
	result := ac.DB.Where("user_id = ? AND topic_name = ?", userData.ID, request.Topic).First(&topicInteraction)

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve topic interaction"})
		return
	}

	now := time.Now()

	if result.Error == gorm.ErrRecordNotFound {
		// Create new topic interaction
		topicInteraction = models.TopicInteraction{
			UserID:     userData.ID,
			TopicName:  request.Topic,
			ViewCount:  1,
			LastViewed: now,
			Rating:     request.Rating,
		}
		if err := ac.DB.Create(&topicInteraction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create topic interaction"})
			return
		}
	} else {
		// Update existing topic interaction
		topicInteraction.Rating = request.Rating

		if err := ac.DB.Save(&topicInteraction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update topic rating"})
			return
		}
	}

	// Create activity log
	activityLog := models.ActivityLog{
		UserID:       userData.ID,
		ActivityType: "topic-rating",
		Description:  "Rated topic: " + request.Topic,
		TopicName:    request.Topic,
		Score:        float64(request.Rating),
		Timestamp:    now,
	}

	if err := ac.DB.Create(&activityLog).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topic rating recorded successfully"})
}

// GetGlobalAnalytics retrieves platform-wide analytics
func (ac *AnalyticsController) GetGlobalAnalytics(c *gin.Context) {
	// Get user from context to verify authentication
	_, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekAgo := today.AddDate(0, 0, -7)

	// Get total users
	var totalUsers int64
	ac.DB.Model(&models.User{}).Count(&totalUsers)

	// Get active users today
	var activeUsersToday int64
	ac.DB.Model(&models.Analytics{}).Where("last_activity_date >= ?", today).Count(&activeUsersToday)

	// Get active users this week
	var activeUsersThisWeek int64
	ac.DB.Model(&models.Analytics{}).Where("last_activity_date >= ?", weekAgo).Count(&activeUsersThisWeek)

	// Get total topics viewed and completed
	var totalTopicsViewed, totalTopicsCompleted int64
	ac.DB.Model(&models.Analytics{}).Select("SUM(topics_viewed)").Row().Scan(&totalTopicsViewed)
	ac.DB.Model(&models.Analytics{}).Select("SUM(topics_completed)").Row().Scan(&totalTopicsCompleted)

	// Get average completion rate
	var avgCompletionRate float64
	ac.DB.Model(&models.Analytics{}).Select("AVG(topic_completion_rate)").Row().Scan(&avgCompletionRate)

	// Get most popular topics
	var popularTopics []models.TopicInteraction
	ac.DB.Model(&models.TopicInteraction{}).
		Select("topic_name, SUM(view_count) as view_count").
		Group("topic_name").
		Order("view_count DESC").
		Limit(5).
		Find(&popularTopics)

	// Extract topic names from popular topics
	mostPopularTopics := make([]string, len(popularTopics))
	for i, topic := range popularTopics {
		mostPopularTopics[i] = topic.TopicName
	}

	// Get average time per session
	var avgTimePerSession float64
	ac.DB.Model(&models.ActivityLog{}).Select("AVG(time_spent)").Row().Scan(&avgTimePerSession)

	// Create response
	response := models.GlobalAnalyticsResponse{
		TotalUsers:            int(totalUsers),
		ActiveUsersToday:      int(activeUsersToday),
		ActiveUsersThisWeek:   int(activeUsersThisWeek),
		TotalTopicsViewed:     int(totalTopicsViewed),
		TotalTopicsCompleted:  int(totalTopicsCompleted),
		AverageCompletionRate: avgCompletionRate,
		MostPopularTopics:     mostPopularTopics,
		AverageTimePerSession: int(avgTimePerSession),
	}

	c.JSON(http.StatusOK, response)
}

// Helper function to update daily activity
func (ac *AnalyticsController) updateDailyActivity(tx *gorm.DB, userID uint, topicsViewed, topicsCompleted, learningTimeMin int) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var dailyActivity models.DailyActivity
	result := tx.Where("user_id = ? AND date = ?", userID, today).First(&dailyActivity)

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return result.Error
	}

	if result.Error == gorm.ErrRecordNotFound {
		// Create new daily activity
		dailyActivity = models.DailyActivity{
			UserID:          userID,
			Date:            today,
			TopicsViewed:    topicsViewed,
			TopicsCompleted: topicsCompleted,
			LearningTimeMin: learningTimeMin,
		}
		return tx.Create(&dailyActivity).Error
	} else {
		// Update existing daily activity
		dailyActivity.TopicsViewed += topicsViewed
		dailyActivity.TopicsCompleted += topicsCompleted
		dailyActivity.LearningTimeMin += learningTimeMin
		return tx.Save(&dailyActivity).Error
	}
}

// Helper function to update daily activity with exercises
func (ac *AnalyticsController) updateDailyActivityWithExercises(tx *gorm.DB, userID uint, topicsViewed, topicsCompleted, learningTimeMin, exercisesDone int) error {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var dailyActivity models.DailyActivity
	result := tx.Where("user_id = ? AND date = ?", userID, today).First(&dailyActivity)

	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return result.Error
	}

	if result.Error == gorm.ErrRecordNotFound {
		// Create new daily activity
		dailyActivity = models.DailyActivity{
			UserID:          userID,
			Date:            today,
			TopicsViewed:    topicsViewed,
			TopicsCompleted: topicsCompleted,
			LearningTimeMin: learningTimeMin,
			ExercisesDone:   exercisesDone,
		}
		return tx.Create(&dailyActivity).Error
	} else {
		// Update existing daily activity
		dailyActivity.TopicsViewed += topicsViewed
		dailyActivity.TopicsCompleted += topicsCompleted
		dailyActivity.LearningTimeMin += learningTimeMin
		dailyActivity.ExercisesDone += exercisesDone
		return tx.Save(&dailyActivity).Error
	}
}

// Helper function to fill in missing daily activity data
func (ac *AnalyticsController) fillMissingDailyActivity(dailyActivity []models.DailyActivity, userID uint, startDate, endDate time.Time) []models.DailyActivity {
	// Create a map to lookup existing activity by date
	activityMap := make(map[string]models.DailyActivity)
	for _, activity := range dailyActivity {
		dateKey := activity.Date.Format("2006-01-02")
		activityMap[dateKey] = activity
	}

	// Create complete list with zeros for missing days
	var completeActivity []models.DailyActivity
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		dateKey := d.Format("2006-01-02")
		if activity, exists := activityMap[dateKey]; exists {
			completeActivity = append(completeActivity, activity)
		} else {
			completeActivity = append(completeActivity, models.DailyActivity{
				UserID:          userID,
				Date:            d,
				TopicsViewed:    0,
				TopicsCompleted: 0,
				LearningTimeMin: 0,
				ExercisesDone:   0,
			})
		}
	}

	return completeActivity
}
