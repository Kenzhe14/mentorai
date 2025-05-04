package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// TopicStatus represents the status of a topic in the learning progress
type TopicStatus struct {
	Viewed      bool      `json:"viewed"`
	Completed   bool      `json:"completed"`
	CompletedAt time.Time `json:"completedAt,omitempty"`
	QuizScore   int       `json:"quizScore"`
	CodeScore   int       `json:"codeScore"`
	LastViewed  time.Time `json:"lastViewed"`
}

// TopicProgressMap is a map of topic names to their status
type TopicProgressMap map[string]TopicStatus

// Value implements the driver.Valuer interface for database serialization
func (t TopicProgressMap) Value() (driver.Value, error) {
	return json.Marshal(t)
}

// Scan implements the sql.Scanner interface for database deserialization
func (t *TopicProgressMap) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal TopicProgressMap value: %v", value)
	}

	if len(bytes) == 0 {
		*t = make(TopicProgressMap)
		return nil
	}

	return json.Unmarshal(bytes, t)
}

// UserProgress represents a user's learning progress
type UserProgress struct {
	gorm.Model
	UserID          uint             `gorm:"index;not null" json:"userId"`
	TopicProgress   TopicProgressMap `gorm:"type:jsonb" json:"topicProgress"`
	TotalTopics     int              `json:"totalTopics"`
	CompletedTopics int              `json:"completedTopics"`
	ViewedTopics    int              `json:"viewedTopics"`
	LastActivity    time.Time        `json:"lastActivity"`
}

// BeforeCreate ensures fields are properly initialized
func (up *UserProgress) BeforeCreate(tx *gorm.DB) error {
	if up.TopicProgress == nil {
		up.TopicProgress = make(TopicProgressMap)
	}
	if up.LastActivity.IsZero() {
		up.LastActivity = time.Now()
	}
	return nil
}

// BeforeSave calculates aggregated statistics before saving
func (up *UserProgress) BeforeSave(tx *gorm.DB) error {
	completedCount := 0
	viewedCount := 0

	for _, status := range up.TopicProgress {
		if status.Completed {
			completedCount++
		}
		if status.Viewed {
			viewedCount++
		}
	}

	up.CompletedTopics = completedCount
	up.ViewedTopics = viewedCount
	up.TotalTopics = len(up.TopicProgress)
	up.LastActivity = time.Now()

	return nil
}
