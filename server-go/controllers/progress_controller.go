package controllers

import (
	"net/http"
	"time"

	"mentorback/models"

	"github.com/gin-gonic/gin"
)

// ProgressController handles progress-related API requests
type ProgressController struct {
	BaseController
}

// NewProgressController creates a new progress controller
func NewProgressController(base BaseController) *ProgressController {
	return &ProgressController{BaseController: base}
}

// UpdateTopicProgress request structure
type UpdateProgressRequest struct {
	Topic     string `json:"topic" binding:"required"`
	Viewed    bool   `json:"viewed"`
	Completed bool   `json:"completed"`
	QuizScore int    `json:"quizScore"`
	CodeScore int    `json:"codeScore"`
}

// GetUserProgress gets the user's learning progress
func (pc *ProgressController) GetUserProgress(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Find or create user progress
	var userProgress models.UserProgress
	result := pc.DB.Where("user_id = ?", userData.ID).First(&userProgress)

	// If no progress record exists, return empty progress
	if result.Error != nil {
		userProgress = models.UserProgress{
			UserID:        userData.ID,
			TopicProgress: make(models.TopicProgressMap),
			LastActivity:  time.Now(),
		}
	}

	// Get user analytics for additional metrics
	var analytics models.Analytics
	pc.DB.Where("user_id = ?", userData.ID).First(&analytics)

	// Calculate topic scores for display in dashboard
	var topicScores struct {
		AvgQuizScore   float64 `json:"avgQuizScore"`
		AvgCodeScore   float64 `json:"avgCodeScore"`
		AvgTimeMinutes float64 `json:"avgTimeMinutes"`
		TotalTopics    int     `json:"totalTopics"`
		RatedTopics    int     `json:"ratedTopics"`
		AvgDifficulty  float64 `json:"avgDifficulty"`
	}

	// Get average scores from topic interactions
	pc.DB.Raw(`
		SELECT 
			AVG(quiz_score) as avg_quiz_score,
			AVG(code_score) as avg_code_score,
			AVG(time_spent) as avg_time_minutes,
			COUNT(*) as total_topics,
			COUNT(CASE WHEN rating > 0 THEN 1 END) as rated_topics,
			AVG(CASE WHEN difficulty > 0 THEN difficulty ELSE NULL END) as avg_difficulty
		FROM topic_interactions
		WHERE user_id = ? AND completed_at IS NOT NULL
	`, userData.ID).Scan(&topicScores)

	// Find the last completed topic
	var lastCompletedTopic struct {
		TopicName   string    `json:"topicName"`
		CompletedAt time.Time `json:"completedAt"`
		QuizScore   float64   `json:"quizScore"`
		CodeScore   float64   `json:"codeScore"`
	}

	pc.DB.Raw(`
		SELECT 
			topic_name as topic_name, 
			completed_at as completed_at,
			quiz_score as quiz_score,
			code_score as code_score
		FROM topic_interactions
		WHERE user_id = ? AND completed_at IS NOT NULL
		ORDER BY completed_at DESC
		LIMIT 1
	`, userData.ID).Scan(&lastCompletedTopic)

	// Create the response
	responseData := gin.H{
		"progress": userProgress,
		"stats": gin.H{
			"completedTopics": userProgress.CompletedTopics,
			"viewedTopics":    userProgress.ViewedTopics,
			"totalTopics":     userProgress.TotalTopics,
			"completionRate":  calculateCompletionRate(userProgress),
		},
		"topicScores": topicScores,
		"analytics": gin.H{
			"averageQuizScore":  analytics.AverageQuizScore,
			"averageCodeScore":  analytics.AverageCodeScore,
			"streakDays":        analytics.StreakDays,
			"totalLearningTime": analytics.TotalLearningTime,
		},
	}

	// Add lastCompletedTopic only if it exists
	if lastCompletedTopic.TopicName != "" {
		responseData["lastCompletedTopic"] = lastCompletedTopic
	} else {
		responseData["lastCompletedTopic"] = nil
	}

	c.JSON(http.StatusOK, responseData)
}

// UpdateTopicProgress updates the progress for a specific topic
func (pc *ProgressController) UpdateTopicProgress(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Parse request body
	var request UpdateProgressRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get or create user progress record
	var userProgress models.UserProgress
	result := pc.DB.Where("user_id = ?", userData.ID).First(&userProgress)

	if result.Error != nil {
		// Create new progress record if not found
		userProgress = models.UserProgress{
			UserID:        userData.ID,
			TopicProgress: make(models.TopicProgressMap),
		}
	}

	// Update topic progress
	now := time.Now()
	if userProgress.TopicProgress == nil {
		userProgress.TopicProgress = make(models.TopicProgressMap)
	}

	// Get existing status or create new one
	status, exists := userProgress.TopicProgress[request.Topic]
	if !exists {
		status = models.TopicStatus{
			LastViewed: now,
		}
	}

	// Update status fields
	if request.Viewed {
		status.Viewed = true
		status.LastViewed = now
	}

	if request.Completed && !status.Completed {
		status.Completed = true
		status.CompletedAt = now
	}

	if request.QuizScore > status.QuizScore {
		status.QuizScore = request.QuizScore
	}

	if request.CodeScore > status.CodeScore {
		status.CodeScore = request.CodeScore
	}

	// Save updated status
	userProgress.TopicProgress[request.Topic] = status
	userProgress.LastActivity = now

	// Save to database
	if result.Error != nil {
		if err := pc.DB.Create(&userProgress).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create progress record"})
			return
		}
	} else {
		if err := pc.DB.Save(&userProgress).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update progress record"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Progress updated successfully",
		"progress": userProgress,
	})
}

// GetTopicProgress gets the progress for a specific topic
func (pc *ProgressController) GetTopicProgress(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Get topic from URL parameter
	topic := c.Param("topic")
	if topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Topic parameter is required"})
		return
	}

	// Find user progress
	var userProgress models.UserProgress
	result := pc.DB.Where("user_id = ?", userData.ID).First(&userProgress)

	// If no progress record exists, or topic not found, return empty status
	if result.Error != nil || userProgress.TopicProgress == nil {
		c.JSON(http.StatusOK, gin.H{
			"topic": topic,
			"status": models.TopicStatus{
				Viewed:    false,
				Completed: false,
			},
		})
		return
	}

	// Get topic status
	status, exists := userProgress.TopicProgress[topic]
	if !exists {
		c.JSON(http.StatusOK, gin.H{
			"topic": topic,
			"status": models.TopicStatus{
				Viewed:    false,
				Completed: false,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"topic":  topic,
		"status": status,
	})
}

// Helper function to calculate completion rate
func calculateCompletionRate(progress models.UserProgress) float64 {
	if progress.TotalTopics == 0 {
		return 0
	}
	return float64(progress.CompletedTopics) / float64(progress.TotalTopics) * 100
}
