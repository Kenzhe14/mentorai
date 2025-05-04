package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Admin represents an administrator in the system
type Admin struct {
	gorm.Model
	Username string `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Email    string `gorm:"size:100;not null;uniqueIndex" json:"email"`
	Password string `gorm:"size:100;not null" json:"-"`
	Role     string `gorm:"size:20;not null;default:'admin'" json:"role"` // admin, super_admin
}

// BeforeCreate is a GORM hook that hashes the password before creating an admin
func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	a.Password = string(hashedPassword)
	return nil
}

// BeforeUpdate is a GORM hook that hashes the password before updating an admin
func (a *Admin) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(a.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		a.Password = string(hashedPassword)
	}
	return nil
}

// ComparePassword compares a plain text password with the admin's hashed password
func (a *Admin) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password))
}

// createSuperAdmin creates a default super admin user if none exists
func createSuperAdmin(db *gorm.DB) error {
	// Check if any admin exists
	var count int64
	if err := db.Model(&Admin{}).Count(&count).Error; err != nil {
		return err
	}

	// If no admin exists, create a default super admin
	if count == 0 {
		defaultAdmin := Admin{
			Username: "admin",
			Email:    "admin@mentorai.com",
			Password: "password123", // This will be hashed by the BeforeCreate hook
			Role:     "super_admin",
		}

		if err := db.Create(&defaultAdmin).Error; err != nil {
			return err
		}
	}

	return nil
}
