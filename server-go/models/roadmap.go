package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"
)

// Roadmap represents a learning roadmap
type Roadmap struct {
	gorm.Model
	Topic  string        `gorm:"size:100;not null" json:"topic"`
	UserID uint          `json:"userId"`
	User   User          `gorm:"foreignKey:UserID" json:"-"`
	Steps  []RoadmapStep `gorm:"foreignKey:RoadmapID" json:"steps"`
}

// RoadmapStep represents a step in a learning roadmap
type RoadmapStep struct {
	gorm.Model
	Name      string  `gorm:"size:100;not null" json:"name"`
	Order     int     `gorm:"not null" json:"order"`
	RoadmapID uint    `json:"roadmapId"`
	Roadmap   Roadmap `gorm:"foreignKey:RoadmapID" json:"-"`
	Completed bool    `gorm:"not null;default:false" json:"completed"`
}

// RecommendedTopic represents a personalized recommended topic
type RecommendedTopic struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    string `json:"duration"`
}

// RecommendedTopics is a slice of RecommendedTopic
type RecommendedTopics []RecommendedTopic

// Value implements the driver.Valuer interface for database serialization
func (rt RecommendedTopics) Value() (driver.Value, error) {
	return json.Marshal(rt)
}

// Scan implements the sql.Scanner interface for database deserialization
func (rt *RecommendedTopics) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal RecommendedTopics value: %v", value)
	}
	return json.Unmarshal(bytes, rt)
}

// PersonalizedContent represents content personalized for a user
type PersonalizedContent struct {
	gorm.Model
	UserID            uint              `json:"userId"`
	User              User              `gorm:"foreignKey:UserID" json:"-"`
	ContentType       string            `gorm:"size:50;not null" json:"contentType"`
	RecommendedTopics RecommendedTopics `gorm:"type:jsonb" json:"recommendedTopics,omitempty"`
	Content           string            `gorm:"type:text" json:"content,omitempty"`
}
