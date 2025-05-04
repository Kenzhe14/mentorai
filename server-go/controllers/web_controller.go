package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// WebController handles web API requests
type WebController struct {
	ContentController  *ContentController
	RoadmapController  *RoadmapController
	ExerciseController *ExerciseController
	LectureController  *LectureController
	ChatController     *ChatController
	BaseController     *BaseController
}

// NewWebController creates a new web controller
func NewWebController(db *gorm.DB) *WebController {
	baseController := NewBaseController(db)
	contentController := NewContentController(*baseController)
	roadmapController := NewRoadmapController(*baseController)
	exerciseController := NewExerciseController(*baseController)
	lectureController := NewLectureController(*baseController)
	chatController := NewChatController(*baseController)

	return &WebController{
		BaseController:     baseController,
		ContentController:  contentController,
		RoadmapController:  roadmapController,
		ExerciseController: exerciseController,
		LectureController:  lectureController,
		ChatController:     chatController,
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
