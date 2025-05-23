package routes

import (
	"mentorback/controllers"
	"mentorback/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRuWebRoutes registers the web routes for Russian content
func RegisterRuWebRoutes(router *gin.Engine, db *gorm.DB) {
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
	ruWebRoutes := router.Group("/ru/api/web")
	{
		// We'll use authentication middleware on the whole group
		ruWebRoutes.Use(middleware.Auth(db))

		ruWebRoutes.POST("/personalized-content", contentController.PersonalizedContent)
		ruWebRoutes.POST("/roadmap", roadmapController.GenerateRoadmap)
		ruWebRoutes.POST("/exercises", exerciseController.GenerateExercises)
		ruWebRoutes.POST("/lecture", lectureController.GenerateLecture)
		ruWebRoutes.POST("/lecture/modular", lectureController.GenerateLecture) // Same function but with a different route name for client distinction
		ruWebRoutes.POST("/chat", chatController.SendChatMessage)
		ruWebRoutes.GET("/chat/sessions", chatController.GetChatSessions)
		ruWebRoutes.GET("/chat/history/:id", chatController.GetChatHistory)

		// Progress routes
		ruWebRoutes.GET("/progress", progressController.GetUserProgress)
		ruWebRoutes.POST("/progress", progressController.UpdateTopicProgress)
		ruWebRoutes.GET("/progress/:topic", progressController.GetTopicProgress)

		// Analytics routes
		ruWebRoutes.GET("/analytics", analyticsController.GetUserAnalytics)
		ruWebRoutes.POST("/analytics/topic-view", analyticsController.TrackTopicView)
		ruWebRoutes.POST("/analytics/topic-completion", analyticsController.TrackTopicCompletion)
		ruWebRoutes.POST("/analytics/exercise-activity", analyticsController.TrackExerciseActivity)
		ruWebRoutes.POST("/analytics/rate-topic", analyticsController.RateTopic)
		ruWebRoutes.GET("/analytics/global", analyticsController.GetGlobalAnalytics)
	}

	// Note: Public routes for Russian API are defined in web_routes.go
	// to avoid duplicating the same code in multiple places
}
