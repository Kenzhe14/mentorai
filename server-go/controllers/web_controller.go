package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// WebController handles web API requests
type WebController struct {
	ContentController   *ContentController
	RoadmapController   *RoadmapController
	ExerciseController  *ExerciseController
	LectureController   *LectureController
	ChatController      *ChatController
	ProgressController  *ProgressController
	AnalyticsController *AnalyticsController
	BaseController      *BaseController
}

// NewWebController creates a new web controller
func NewWebController(db *gorm.DB) *WebController {
	baseController := NewBaseController(db)
	contentController := NewContentController(*baseController)
	roadmapController := NewRoadmapController(*baseController)
	exerciseController := NewExerciseController(*baseController)
	lectureController := NewLectureController(*baseController)
	chatController := NewChatController(*baseController)
	progressController := NewProgressController(*baseController)
	analyticsController := NewAnalyticsController(*baseController)

	return &WebController{
		ContentController:   contentController,
		RoadmapController:   roadmapController,
		ExerciseController:  exerciseController,
		LectureController:   lectureController,
		ChatController:      chatController,
		ProgressController:  progressController,
		AnalyticsController: analyticsController,
		BaseController:      baseController,
	}
}

// RegisterRoutes registers all routes for the web controller
func (wc *WebController) RegisterRoutes(router *gin.Engine) {
	// Personalized content routes
	router.POST("/api/personalized-content", wc.ContentController.PersonalizedContent)

	// Roadmap routes
	router.POST("/api/roadmap", wc.RoadmapController.GenerateRoadmap)

	// Exercise routes
	router.POST("/api/exercises", wc.ExerciseController.GenerateExercises)

	// Lecture routes
	router.POST("/api/lecture", wc.LectureController.GenerateLecture)
	router.POST("/api/lecture/modular", wc.LectureController.GenerateLecture)

	// Chat routes
	router.POST("/api/chat", wc.ChatController.SendChatMessage)
	router.GET("/api/chat/sessions", wc.ChatController.GetChatSessions)
	router.GET("/api/chat/history/:id", wc.ChatController.GetChatHistory)

	// Progress routes
	router.GET("/api/progress", wc.ProgressController.GetUserProgress)
	router.POST("/api/progress", wc.ProgressController.UpdateTopicProgress)
	router.GET("/api/progress/:topic", wc.ProgressController.GetTopicProgress)

	// Analytics routes
	router.GET("/api/analytics", wc.AnalyticsController.GetUserAnalytics)
	router.POST("/api/analytics/topic-view", wc.AnalyticsController.TrackTopicView)
	router.POST("/api/analytics/topic-completion", wc.AnalyticsController.TrackTopicCompletion)
	router.POST("/api/analytics/exercise-activity", wc.AnalyticsController.TrackExerciseActivity)
	router.POST("/api/analytics/rate-topic", wc.AnalyticsController.RateTopic)
	router.GET("/api/analytics/global", wc.AnalyticsController.GetGlobalAnalytics)
}

// PersonalizedContent forwards to the content controller
func (wc *WebController) PersonalizedContent(c *gin.Context) {
	wc.ContentController.PersonalizedContent(c)
}

// GenerateRoadmap forwards to the roadmap controller
func (wc *WebController) GenerateRoadmap(c *gin.Context) {
	wc.RoadmapController.GenerateRoadmap(c)
}

// GenerateExercises forwards to the exercise controller
func (wc *WebController) GenerateExercises(c *gin.Context) {
	wc.ExerciseController.GenerateExercises(c)
}

// GenerateLecture forwards to the lecture controller
func (wc *WebController) GenerateLecture(c *gin.Context) {
	wc.LectureController.GenerateLecture(c)
}

// SendChatMessage forwards to the chat controller
func (wc *WebController) SendChatMessage(c *gin.Context) {
	wc.ChatController.SendChatMessage(c)
}

// GetChatSessions forwards to the chat controller
func (wc *WebController) GetChatSessions(c *gin.Context) {
	wc.ChatController.GetChatSessions(c)
}

// GetChatHistory forwards to the chat controller
func (wc *WebController) GetChatHistory(c *gin.Context) {
	wc.ChatController.GetChatHistory(c)
}

// GetUserProgress forwards to the progress controller
func (wc *WebController) GetUserProgress(c *gin.Context) {
	wc.ProgressController.GetUserProgress(c)
}

// UpdateTopicProgress forwards to the progress controller
func (wc *WebController) UpdateTopicProgress(c *gin.Context) {
	wc.ProgressController.UpdateTopicProgress(c)
}

// GetTopicProgress forwards to the progress controller
func (wc *WebController) GetTopicProgress(c *gin.Context) {
	wc.ProgressController.GetTopicProgress(c)
}

// GetUserAnalytics forwards to the analytics controller
func (wc *WebController) GetUserAnalytics(c *gin.Context) {
	wc.AnalyticsController.GetUserAnalytics(c)
}

// TrackTopicView forwards to the analytics controller
func (wc *WebController) TrackTopicView(c *gin.Context) {
	wc.AnalyticsController.TrackTopicView(c)
}

// TrackTopicCompletion forwards to the analytics controller
func (wc *WebController) TrackTopicCompletion(c *gin.Context) {
	wc.AnalyticsController.TrackTopicCompletion(c)
}

// TrackExerciseActivity forwards to the analytics controller
func (wc *WebController) TrackExerciseActivity(c *gin.Context) {
	wc.AnalyticsController.TrackExerciseActivity(c)
}

// RateTopic forwards to the analytics controller
func (wc *WebController) RateTopic(c *gin.Context) {
	wc.AnalyticsController.RateTopic(c)
}

// GetGlobalAnalytics forwards to the analytics controller
func (wc *WebController) GetGlobalAnalytics(c *gin.Context) {
	wc.AnalyticsController.GetGlobalAnalytics(c)
}
