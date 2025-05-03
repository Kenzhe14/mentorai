package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
	"github.com/lib/pq"
)

// SocialLinks represents mentor's social media links
type SocialLinks struct {
	LinkedIn string `json:"linkedin,omitempty"`
	GitHub   string `json:"github,omitempty"`
	Twitter  string `json:"twitter,omitempty"`
	Website  string `json:"website,omitempty"`
}

// Value implements the driver.Valuer interface for database serialization
func (s SocialLinks) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements the sql.Scanner interface for database deserialization
func (s *SocialLinks) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal SocialLinks value: %v", value)
	}
	return json.Unmarshal(bytes, s)
}

// Mentor represents a mentor in the system
type Mentor struct {
	gorm.Model
	UserID         uint        `json:"userId,omitempty"`
	Username       string      `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Name           string      `gorm:"size:100;not null" json:"name"`
	Email          string      `gorm:"size:100;not null;uniqueIndex" json:"email"`
	Password       string      `gorm:"size:100;not null" json:"-"`
	Skills         pq.StringArray `gorm:"type:text[]" json:"skills"`
	Experience     string      `gorm:"size:20;not null" json:"experience"`
	Rating         float32     `gorm:"not null;default:0" json:"rating"`
	Reviews        int         `gorm:"not null;default:0" json:"reviews"`
	HourlyRate     float32     `gorm:"not null" json:"hourlyRate"`
	Avatar         string      `json:"avatar,omitempty"`
	Available      bool        `gorm:"not null;default:true" json:"available"`
	Bio            string      `gorm:"type:text" json:"bio,omitempty"`
	SocialLinks    SocialLinks `gorm:"type:jsonb" json:"socialLinks,omitempty"`
	Specializations pq.StringArray `gorm:"type:text[]" json:"specializations,omitempty"`
	Languages      pq.StringArray `gorm:"type:text[];default:'{English}'" json:"languages"`
	Timezone       string      `json:"timezone,omitempty"`
	Verified       bool        `gorm:"not null;default:false" json:"verified"`
	DisplayName    string      `gorm:"size:100" json:"displayName"`
	AvatarURL      string      `gorm:"size:255" json:"avatarUrl"`
	Phone          string      `gorm:"size:15" json:"phone"`
	IsMentor       bool        `gorm:"not null;default:true" json:"isMentor"`
}

// BeforeCreate is a GORM hook that hashes the password before creating a mentor
func (m *Mentor) BeforeCreate(tx *gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(m.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	m.Password = string(hashedPassword)
	return nil
}

// BeforeUpdate is a GORM hook that hashes the password before updating a mentor
func (m *Mentor) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(m.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		m.Password = string(hashedPassword)
	}
	return nil
}

// ComparePassword compares a plain text password with the mentor's hashed password
func (m *Mentor) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(m.Password), []byte(password))
}

// UpdateRating updates the mentor's rating with a new review
func (m *Mentor) UpdateRating(db *gorm.DB, newRating float32) error {
	totalRatingPoints := m.Rating * float32(m.Reviews)
	m.Reviews++
	m.Rating = (totalRatingPoints + newRating) / float32(m.Reviews)
	return db.Save(m).Error
}

// ToggleAvailability toggles the mentor's availability status
func (m *Mentor) ToggleAvailability(db *gorm.DB) error {
	m.Available = !m.Available
	return db.Save(m).Error
} 