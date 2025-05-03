package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/controllers"
	"mentorback/middleware"
)

// RegisterMentorRoutes registers the mentor-specific routes
func RegisterMentorRoutes(router *gin.Engine, db *gorm.DB) {
	// Create mentor controller
	mentorController := controllers.NewMentorController(db)
	
	// Create mentor routes group with authentication and mentor-only middleware
	mentorRoutes := router.Group("/api/mentor")
	{
		// All mentor routes require authentication
		mentorRoutes.Use(middleware.Auth(db))
		mentorRoutes.Use(middleware.MentorOnly(db))
		
		// Dashboard data
		mentorRoutes.GET("/dashboard", mentorController.GetDashboardData)
		
		// Students data
		mentorRoutes.GET("/students", mentorController.GetStudentsData)
		
		// Student roadmaps
		mentorRoutes.GET("/students/:studentId/roadmaps", mentorController.GetStudentRoadmaps)
	}
} 