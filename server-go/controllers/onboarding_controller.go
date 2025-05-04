package controllers

import (
	"net/http"

	"mentorback/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// OnboardingController handles user onboarding
type OnboardingController struct {
	DB *gorm.DB
}

// NewOnboardingController creates a new onboarding controller
func NewOnboardingController(db *gorm.DB) *OnboardingController {
	return &OnboardingController{DB: db}
}

// SaveOnboardingRequest represents the save onboarding request body
type SaveOnboardingRequest struct {
	Age           string   `json:"age" binding:"required"`
	Experience    string   `json:"experience" binding:"required"`
	Interests     []string `json:"interests" binding:"required"`
	Goals         []string `json:"goals" binding:"required"`
	LearningStyle string   `json:"learningStyle" binding:"required"`
}

// OnboardingResponse represents the onboarding response
type OnboardingResponse struct {
	Success bool                  `json:"success"`
	Message string                `json:"message,omitempty"`
	Data    models.OnboardingData `json:"data,omitempty"`
}

// SaveOnboarding saves user onboarding data
func (oc *OnboardingController) SaveOnboarding(c *gin.Context) {
	var request SaveOnboardingRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	// Update user with onboarding data
	userData := user.(models.User)
	userData.OnboardingData = models.OnboardingData{
		Age:           request.Age,
		Experience:    request.Experience,
		Interests:     request.Interests,
		Goals:         request.Goals,
		LearningStyle: request.LearningStyle,
		Completed:     true,
	}

	// Save the user to the database
	result := oc.DB.Save(&userData)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save onboarding data: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, OnboardingResponse{
		Success: true,
		Message: "Onboarding data saved successfully",
		Data:    userData.OnboardingData,
	})
}

// GetOnboardingData gets user onboarding data
func (oc *OnboardingController) GetOnboardingData(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userData := user.(models.User)
	if !userData.OnboardingData.Completed {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Onboarding data not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    userData.OnboardingData,
	})
}

// CheckOnboardingStatus checks if user onboarding is completed
func (oc *OnboardingController) CheckOnboardingStatus(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userData := user.(models.User)
	isCompleted := userData.OnboardingData.Completed

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"completed": isCompleted,
	})
}
