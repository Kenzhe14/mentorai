package models

import (
	"time"

	"gorm.io/gorm"
)

// Analytics represents aggregated user learning statistics
type Analytics struct {
	gorm.Model
	UserID              uint      `gorm:"index;not null" json:"userId"`
	TopicsViewed        int       `json:"topicsViewed"`
	TopicsCompleted     int       `json:"topicsCompleted"`
	TotalLearningTime   int       `json:"totalLearningTime"` // In minutes
	StreakDays          int       `json:"streakDays"`
	LastActivityDate    time.Time `json:"lastActivityDate"`
	ExercisesCompleted  int       `json:"exercisesCompleted"`
	ExercisesAttempted  int       `json:"exercisesAttempted"`
	AverageQuizScore    float64   `json:"averageQuizScore"` // Percentage from 0-100
	AverageCodeScore    float64   `json:"averageCodeScore"` // Percentage from 0-100
	LastTopicAccessed   string    `json:"lastTopicAccessed"`
	TopicCompletionRate float64   `json:"topicCompletionRate"` // Percentage from 0-100
}

// TopicInteraction tracks detailed user interactions with a specific topic
type TopicInteraction struct {
	gorm.Model
	UserID      uint      `gorm:"index;not null" json:"userId"`
	TopicName   string    `gorm:"index" json:"topicName"`
	ViewCount   int       `json:"viewCount"`
	TimeSpent   int       `json:"timeSpent"` // In minutes
	LastViewed  time.Time `json:"lastViewed,omitempty"`
	CompletedAt time.Time `json:"completedAt,omitempty"`
	Rating      int       `json:"rating,omitempty"`     // User rating from 1-5
	Difficulty  int       `json:"difficulty,omitempty"` // User-reported difficulty from 1-5
	QuizScore   float64   `json:"quizScore,omitempty"`  // Quiz score from 0-100
	CodeScore   float64   `json:"codeScore,omitempty"`  // Code exercise score from 0-100
}

// ActivityLog tracks individual user learning activities
type ActivityLog struct {
	gorm.Model
	UserID       uint      `gorm:"index;not null" json:"userId"`
	ActivityType string    `json:"activityType"` // "topic-view", "topic-completion", "exercise", etc.
	Description  string    `json:"description"`
	TopicName    string    `json:"topicName,omitempty"`
	ExerciseID   string    `json:"exerciseId,omitempty"`
	TimeSpent    int       `json:"timeSpent,omitempty"` // In minutes
	Score        float64   `json:"score,omitempty"`     // Score achieved (for exercises)
	Timestamp    time.Time `json:"timestamp"`
}

// DailyActivity tracks a user's learning activity for a specific day
type DailyActivity struct {
	gorm.Model
	UserID          uint      `gorm:"index;not null" json:"userId"`
	Date            time.Time `gorm:"index" json:"date"`
	LearningTimeMin int       `json:"learningTimeMin"` // Minutes spent learning
	TopicsViewed    int       `json:"topicsViewed"`    // Number of topics viewed
	TopicsCompleted int       `json:"topicsCompleted"` // Number of topics completed
	ExercisesDone   int       `json:"exercisesDone"`   // Number of exercises completed
}

// AnalyticsResponse structures the response for the analytics API
type AnalyticsResponse struct {
	Analytics        *Analytics         `json:"analytics"`
	DailyActivity    []DailyActivity    `json:"dailyActivity,omitempty"`
	TopInteractions  []TopicInteraction `json:"topInteractions,omitempty"`
	RecentActivities []ActivityLog      `json:"recentActivities,omitempty"`
}

// GlobalAnalyticsResponse structures the response for global platform-wide analytics
type GlobalAnalyticsResponse struct {
	TotalUsers            int      `json:"totalUsers"`
	ActiveUsersToday      int      `json:"activeUsersToday"`
	ActiveUsersThisWeek   int      `json:"activeUsersThisWeek"`
	TotalTopicsViewed     int      `json:"totalTopicsViewed"`
	TotalTopicsCompleted  int      `json:"totalTopicsCompleted"`
	AverageCompletionRate float64  `json:"averageCompletionRate"`
	MostPopularTopics     []string `json:"mostPopularTopics"`
	AverageTimePerSession int      `json:"averageTimePerSession"` // In minutes
}
