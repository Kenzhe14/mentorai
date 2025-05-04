package routes

import (
	"mentorback/controllers"
	"mentorback/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterEnWebRoutes registers the web routes for English content
func RegisterEnWebRoutes(router *gin.Engine, db *gorm.DB) {
	// Create base controller for shared OpenAI functionality
	baseController := controllers.NewBaseController(db)

	// Create specialized controllers using the base controller pointer
	contentController := controllers.NewContentController(*baseController)
	roadmapController := controllers.NewRoadmapController(*baseController)
	lectureController := controllers.NewLectureController(*baseController)
	chatController := controllers.NewChatController(*baseController)
	exerciseController := controllers.NewExerciseController(*baseController)
	progressController := controllers.NewProgressController(*baseController)
	analyticsController := controllers.NewAnalyticsController(*baseController)

	// Create web routes group
	enWebRoutes := router.Group("/en/api/web")
	{
		// We'll use authentication middleware on the whole group
		enWebRoutes.Use(middleware.Auth(db))

		enWebRoutes.POST("/personalized-content", contentController.PersonalizedContent)
		enWebRoutes.POST("/roadmap", roadmapController.GenerateRoadmap)
		enWebRoutes.POST("/exercises", exerciseController.GenerateExercises)
		enWebRoutes.POST("/lecture", lectureController.GenerateLecture)
		enWebRoutes.POST("/lecture/modular", lectureController.GenerateLecture) // Same function but with a different route name for client distinction
		enWebRoutes.POST("/chat", chatController.SendChatMessage)
		enWebRoutes.GET("/chat/sessions", chatController.GetChatSessions)
		enWebRoutes.GET("/chat/history/:id", chatController.GetChatHistory)

		// Progress routes
		enWebRoutes.GET("/progress", progressController.GetUserProgress)
		enWebRoutes.POST("/progress", progressController.UpdateTopicProgress)
		enWebRoutes.GET("/progress/:topic", progressController.GetTopicProgress)

		// Analytics routes
		enWebRoutes.GET("/analytics", analyticsController.GetUserAnalytics)
		enWebRoutes.POST("/analytics/topic-view", analyticsController.TrackTopicView)
		enWebRoutes.POST("/analytics/topic-completion", analyticsController.TrackTopicCompletion)
		enWebRoutes.POST("/analytics/exercise-activity", analyticsController.TrackExerciseActivity)
		enWebRoutes.POST("/analytics/rate-topic", analyticsController.RateTopic)
		enWebRoutes.GET("/analytics/global", analyticsController.GetGlobalAnalytics)
	}

	// Public routes for English API are defined in web_routes.go
	// to avoid duplicating the same code in multiple places
}
