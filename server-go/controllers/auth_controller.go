package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"gorm.io/gorm"
	"mentorback/middleware"
	"mentorback/models"
)

// AuthController handles user authentication
type AuthController struct {
	DB *gorm.DB
}

// NewAuthController creates a new auth controller
func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{DB: db}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents the register request body
type RegisterRequest struct {
	Username      string               `json:"username" binding:"required"`
	Email         string               `json:"email"`
	Phone         string               `json:"phone"`
	Password      string               `json:"password" binding:"required"`
	OnboardingData models.OnboardingData `json:"onboardingData"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	User    models.User `json:"user,omitempty"`
}

// MentorRegisterRequest represents the mentor registration request body
type MentorRegisterRequest struct {
	Username        string               `json:"username" binding:"required"`
	Name            string               `json:"name" binding:"required"`
	Email           string               `json:"email" binding:"required"`
	Phone           string               `json:"phone"`
	Password        string               `json:"password" binding:"required"`
	Skills          pq.StringArray       `json:"skills" binding:"required"`
	Experience      string               `json:"experience" binding:"required"`
	HourlyRate      float32              `json:"hourlyRate" binding:"required"`
	Bio             string               `json:"bio"`
	SocialLinks     models.SocialLinks   `json:"socialLinks"`
	Specializations pq.StringArray       `json:"specializations"`
	Languages       pq.StringArray       `json:"languages"`
	Timezone        string               `json:"timezone"`
	Role            string               `json:"role"`
}

// MentorAuthResponse represents the mentor authentication response
type MentorAuthResponse struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	User    models.User  `json:"user,omitempty"`
	Mentor  models.Mentor `json:"mentor,omitempty"`
}

// Register handles user registration
func (ac *AuthController) Register(c *gin.Context) {
	var request RegisterRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create a new user
	user := models.User{
		Username:       request.Username,
		Email:          request.Email,
		Phone:          request.Phone,
		Password:       request.Password,
		OnboardingData: request.OnboardingData,
	}
	
	// Set completed flag if onboarding data is provided
	if !user.OnboardingData.Completed && (len(user.OnboardingData.Interests) > 0 || len(user.OnboardingData.Goals) > 0) {
		user.OnboardingData.Completed = true
	}

	// Save the user to the database
	result := ac.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user: " + result.Error.Error()})
		return
	}

	// Set the authentication cookie with user type
	if err := middleware.SetAuthCookie(c, user.ID, "user"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set authentication cookie: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Success: true,
		Message: "User registered successfully",
		User:    user,
	})
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	var request LoginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Try to find user in the users table
	var user models.User
	userResult := ac.DB.Where("username = ?", request.Username).First(&user)
	
	// Try to find mentor in the mentors table
	var mentor models.Mentor
	mentorResult := ac.DB.Where("username = ?", request.Username).First(&mentor)
	
	// Check if we found either a user or mentor
	if userResult.Error != nil && mentorResult.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}
	
	// Handle user login
	if userResult.Error == nil {
		// Check if the password is correct
		err := user.ComparePassword(request.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// Set the authentication cookie with user type
		if err := middleware.SetAuthCookie(c, user.ID, "user"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set authentication cookie: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, AuthResponse{
			Success: true,
			Message: "Login successful",
			User:    user,
		})
		return
	}
	
	// Handle mentor login
	if mentorResult.Error == nil {
		// Check if the password is correct
		err := mentor.ComparePassword(request.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
			return
		}

		// Set the authentication cookie with mentor type
		if err := middleware.SetAuthCookie(c, mentor.ID, "mentor"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set authentication cookie: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, MentorAuthResponse{
			Success: true,
			Message: "Login successful",
			Mentor:  mentor,
		})
		return
	}
}

// Logout handles user logout
func (ac *AuthController) Logout(c *gin.Context) {
	middleware.ClearAuthCookie(c)
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged out successfully",
	})
}

// GetCurrentUser returns the current authenticated user
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	// Get the user from context
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	
	// Get user type
	userType, _ := c.Get("userType")
	userTypeStr, ok := userType.(string)
	if !ok {
		userTypeStr = "user" // Default for backward compatibility
	}
	
	response := gin.H{
		"success": true,
	}
	
	// Add user data based on type
	if userTypeStr == "mentor" {
		mentor, ok := userData.(models.Mentor)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid mentor data"})
			return
		}
		response["user"] = mentor
		response["isMentor"] = true
	} else {
		user, ok := userData.(models.User)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
			return
		}
		response["user"] = user
		response["isMentor"] = false
	}
	
	c.JSON(http.StatusOK, response)
}

// RegisterMentor handles mentor registration
func (ac *AuthController) RegisterMentor(c *gin.Context) {
	var request MentorRegisterRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start a transaction
	tx := ac.DB.Begin()
	
	// Ensure arrays are initialized properly
	if len(request.Skills) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one skill is required"})
		tx.Rollback()
		return
	}
	
	if len(request.Languages) == 0 {
		request.Languages = pq.StringArray{"English"}
	}

	// Verify mentor fields
	if request.HourlyRate <= 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Hourly rate must be greater than 0"})
		return
	}

	// Create the mentor directly without creating a user
	mentor := models.Mentor{
		Username:        request.Username,
		Name:            request.Name,
		Email:           request.Email,
		Password:        request.Password,
		Experience:      request.Experience,
		HourlyRate:      request.HourlyRate,
		Bio:             request.Bio,
		SocialLinks:     request.SocialLinks,
		Timezone:        request.Timezone,
		Skills:          request.Skills,
		Languages:       request.Languages,
		Specializations: request.Specializations,
		DisplayName:     request.Name,
		Phone:           request.Phone,
		IsMentor:        true,
	}
	
	// Save the mentor to the database
	if err := tx.Create(&mentor).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register mentor: " + err.Error()})
		return
	}
	
	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction: " + err.Error()})
		return
	}

	// Set the authentication cookie directly with mentor ID and type
	if err := middleware.SetAuthCookie(c, mentor.ID, "mentor"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set authentication cookie: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, MentorAuthResponse{
		Success: true,
		Message: "Mentor registered successfully",
		Mentor:  mentor,
	})
} 