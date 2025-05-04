package routes

import (
	"mentorback/controllers"
	"mentorback/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterWebRoutes registers the web routes for English content
// Note: This function also registers the Russian public routes to avoid
// duplicating code between files. The main Russian routes are in ru_web_routes.go
func RegisterWebRoutes(router *gin.Engine, db *gorm.DB) {
	// Create controllers
	mentorsController := controllers.NewMentorsController(db)

	// Create base controller for shared OpenAI functionality
	baseController := controllers.NewBaseController(db)

	// Create specialized controllers using the base controller pointer
	contentController := controllers.NewContentController(*baseController)
	roadmapController := controllers.NewRoadmapController(*baseController)
	lectureController := controllers.NewLectureController(*baseController)
	chatController := controllers.NewChatController(*baseController)
	exerciseController := controllers.NewExerciseController(*baseController)
	progressController := controllers.NewProgressController(*baseController)

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

		webRoutes.POST("/personalized-content", contentController.PersonalizedContent)
		webRoutes.POST("/roadmap", roadmapController.GenerateRoadmap)
		webRoutes.POST("/lecture", lectureController.GenerateLecture)
		webRoutes.POST("/lecture/modular", lectureController.GenerateLecture)
		webRoutes.POST("/chat", chatController.SendChatMessage)
		webRoutes.GET("/chat/sessions", chatController.GetChatSessions)
		webRoutes.GET("/chat/history/:id", chatController.GetChatHistory)
		webRoutes.DELETE("/chat/all", chatController.DeleteAllChats)

		// Progress tracking endpoints
		webRoutes.GET("/progress", progressController.GetUserProgress)
		webRoutes.POST("/progress/topic", progressController.UpdateTopicProgress)
		webRoutes.GET("/progress/topic/:topic", progressController.GetTopicProgress)

		// Exercise endpoints for authenticated users
		webRoutes.POST("/exercises", exerciseController.GenerateExercises)
	}

	// Also create a public route for exercises with optional authentication
	// This helps the frontend work even when users aren't authenticated
	publicRoutes = router.Group("/en/api/public")
	{
		publicRoutes.Use(middleware.OptionalAuth(db))
		publicRoutes.POST("/exercises", exerciseController.GenerateExercises)
	}

	// Public Russian routes - only adding public exercises route here
	// The rest of Russian routes are defined in ru_web_routes.go
	ruPublicRoutes := router.Group("/ru/api/public")
	{
		ruPublicRoutes.Use(middleware.OptionalAuth(db))
		ruPublicRoutes.POST("/exercises", exerciseController.GenerateExercises)
	}
}
