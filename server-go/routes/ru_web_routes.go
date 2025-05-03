package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/controllers"
	"mentorback/middleware"
)

// RegisterRuWebRoutes registers the web routes for Russian content
func RegisterRuWebRoutes(router *gin.Engine, db *gorm.DB) {
	// Create web controller
	webController := controllers.NewWebController(db)

	// Create web routes group
	ruWebRoutes := router.Group("/ru/api/web")
	{
		// We'll use authentication middleware on the whole group
		ruWebRoutes.Use(middleware.Auth(db))
		
		ruWebRoutes.POST("/personalized-content", webController.PersonalizedContent)
		ruWebRoutes.POST("/roadmap", webController.GenerateRoadmap)
		ruWebRoutes.POST("/exercises", webController.GenerateExercises)
		ruWebRoutes.POST("/lecture", webController.GenerateLecture)
		ruWebRoutes.POST("/lecture/modular", webController.GenerateLecture) // Same function but with a different route name for client distinction
		ruWebRoutes.POST("/chat", webController.SendChatMessage)
		ruWebRoutes.GET("/chat/sessions", webController.GetChatSessions)
		ruWebRoutes.GET("/chat/history/:id", webController.GetChatHistory)
	}
	
	// Note: Public routes for Russian API are defined in web_routes.go
	// to avoid duplicating the same code in multiple places
} 