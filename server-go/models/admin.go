package models

import (
	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
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