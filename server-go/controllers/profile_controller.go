package controllers

import (
	"net/http"
	"path/filepath"
	"os"
	"io"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/models"
)

// ProfileController handles user profile operations
type ProfileController struct {
	DB *gorm.DB
}

// NewProfileController creates a new profile controller
func NewProfileController(db *gorm.DB) *ProfileController {
	return &ProfileController{DB: db}
}

// UpdateProfileRequest represents the update profile request
type UpdateProfileRequest struct {
	DisplayName string `json:"displayName"`
}

// ProfileResponse represents the profile update response
type ProfileResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	User    models.User `json:"user,omitempty"`
}

// UpdateProfile updates a user's profile information
func (pc *ProfileController) UpdateProfile(c *gin.Context) {
	var request UpdateProfileRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not found in context"})
		return
	}

	userData := user.(models.User)

	// Update the user's display name if provided
	if request.DisplayName != "" {
		userData.DisplayName = request.DisplayName
	}

	// Save the updated user to database
	if err := pc.DB.Save(&userData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, ProfileResponse{
		Success: true,
		Message: "Profile updated successfully",
		User:    userData,
	})
}

// UploadAvatar handles avatar image uploads
func (pc *ProfileController) UploadAvatar(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not found in context"})
		return
	}

	userData := user.(models.User)

	// Get the uploaded file
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "No avatar file provided: " + err.Error()})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadsDir := "uploads/avatars"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create uploads directory: " + err.Error()})
		return
	}

	// Generate a unique filename
	filename := fmt.Sprintf("%d_%s", userData.ID, filepath.Base(file.Filename))
	filePath := filepath.Join(uploadsDir, filename)

	// Save the file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create file: " + err.Error()})
		return
	}
	defer dst.Close()

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to open uploaded file: " + err.Error()})
		return
	}
	defer src.Close()

	// Copy the file
	if _, err = io.Copy(dst, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to copy file: " + err.Error()})
		return
	}

	// Update the user's avatar URL
	avatarURL := fmt.Sprintf("/uploads/avatars/%s", filename)
	userData.AvatarURL = avatarURL

	// Save the updated user to database
	if err := pc.DB.Save(&userData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update avatar: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Avatar uploaded successfully",
		"avatarUrl": avatarURL,
		"user": userData,
	})
}

// GetProfile gets the current user's profile
func (pc *ProfileController) GetProfile(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not found in context"})
		return
	}

	userData := user.(models.User)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": userData,
	})
} 