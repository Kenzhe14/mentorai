package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/controllers"
	"mentorback/middleware"
)

// RegisterWebRoutes registers the web routes for English content
// Note: This function also registers the Russian public routes to avoid
// duplicating code between files. The main Russian routes are in ru_web_routes.go
func RegisterWebRoutes(router *gin.Engine, db *gorm.DB) {
	// Create controllers
	mentorsController := controllers.NewMentorsController(db)
	webController := controllers.NewWebController(db)

	// Public routes for mentors
	publicRoutes := router.Group("/api")
	{
		// Mentors listing route
		publicRoutes.GET("/mentors", mentorsController.GetMentors)
	}

	// Create web routes group with authentication
	webRoutes := router.Group("/en/api/web")
	{
		// We'll use authentication middleware on the whole group
		webRoutes.Use(middleware.Auth(db))
		
		webRoutes.POST("/personalized-content", webController.PersonalizedContent)
		webRoutes.POST("/roadmap", webController.GenerateRoadmap)
		webRoutes.POST("/lecture", webController.GenerateLecture)
		webRoutes.POST("/lecture/modular", webController.GenerateLecture)
		webRoutes.POST("/chat", webController.SendChatMessage)
		webRoutes.GET("/chat/sessions", webController.GetChatSessions)
		webRoutes.GET("/chat/history/:id", webController.GetChatHistory)
		
		// Keep exercises endpoint for authenticated users
		webRoutes.POST("/exercises", webController.GenerateExercises)
	}
	
	// Also create a public route for exercises with optional authentication
	// This helps the frontend work even when users aren't authenticated
	publicRoutes = router.Group("/en/api/public")
	{
		publicRoutes.Use(middleware.OptionalAuth(db))
		publicRoutes.POST("/exercises", webController.GenerateExercises)
	}
	
	// Public Russian routes - only adding public exercises route here
	// The rest of Russian routes are defined in ru_web_routes.go
	ruPublicRoutes := router.Group("/ru/api/public")
	{
		ruPublicRoutes.Use(middleware.OptionalAuth(db))
		ruPublicRoutes.POST("/exercises", webController.GenerateExercises)
	}
} 