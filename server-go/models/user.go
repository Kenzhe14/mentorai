package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
)

// OnboardingData represents user onboarding data
type OnboardingData struct {
	Age            string   `json:"age"`
	Experience     string   `json:"experience"`
	Interests      []string `json:"interests"`
	Goals          []string `json:"goals"`
	LearningStyle  string   `json:"learningStyle"`
	Completed      bool     `json:"completed"`
}

// Value implements the driver.Valuer interface for database serialization
func (o OnboardingData) Value() (driver.Value, error) {
	// Initialize nil slices as empty arrays before serializing
	o.ensureInitialized()
	return json.Marshal(o)
}

// Scan implements the sql.Scanner interface for database deserialization
func (o *OnboardingData) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal OnboardingData value: %v", value)
	}
	err := json.Unmarshal(bytes, o)
	if err != nil {
		return err
	}
	// Initialize nil slices as empty arrays after deserializing
	o.ensureInitialized()
	return nil
}

// ensureInitialized ensures that all slice fields are initialized
func (o *OnboardingData) ensureInitialized() {
	if o.Interests == nil {
		o.Interests = []string{}
	}
	if o.Goals == nil {
		o.Goals = []string{}
	}
}

// User represents a user in the system
type User struct {
	gorm.Model
	Username       string        `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Email          string        `gorm:"size:100;uniqueIndex" json:"email"`
	Phone          string        `gorm:"size:15;uniqueIndex" json:"phone"`
	Password       string        `gorm:"size:100;not null" json:"-"`
	DisplayName    string        `gorm:"size:100" json:"displayName"`
	AvatarURL      string        `gorm:"size:255" json:"avatarUrl"`
	OnboardingData OnboardingData `gorm:"type:jsonb" json:"onboardingData"`
}

// BeforeCreate is a GORM hook that hashes the password before creating a user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	
	// Set default display name if empty
	if u.DisplayName == "" {
		u.DisplayName = u.Username
	}
	
	return nil
}

// BeforeUpdate is a GORM hook that hashes the password before updating a user
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// ComparePassword compares a plain text password with the user's hashed password
func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
} 