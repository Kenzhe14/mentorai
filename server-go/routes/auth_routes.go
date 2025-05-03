package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/controllers"
	"mentorback/middleware"
)

// RegisterAuthRoutes registers the authentication routes
func RegisterAuthRoutes(router *gin.Engine, db *gorm.DB) {
	// Create auth controller
	authController := controllers.NewAuthController(db)
	
	// Create profile controller
	profileController := controllers.NewProfileController(db)

	// Create auth routes
	authRoutes := router.Group("/api/auth")
	{
		authRoutes.POST("/register", authController.Register)
		authRoutes.POST("/register-mentor", authController.RegisterMentor)
		authRoutes.POST("/login", authController.Login)
		authRoutes.POST("/logout", authController.Logout)
		
		// Protected routes that require authentication
		authRoutes.Use(middleware.Auth(db))
		authRoutes.GET("/me", authController.GetCurrentUser)
	}
	
	// Create profile routes
	profileRoutes := router.Group("/api/profile")
	{
		// All profile routes require authentication
		profileRoutes.Use(middleware.Auth(db))
		
		// Get user profile
		profileRoutes.GET("", profileController.GetProfile)
		
		// Update user profile
		profileRoutes.PUT("", profileController.UpdateProfile)
		
		// Upload avatar
		profileRoutes.POST("/avatar", profileController.UploadAvatar)
	}
} 