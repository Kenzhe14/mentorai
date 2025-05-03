package routes

import (
	"github.com/gin-gonic/gin"
	"mentorback/controllers"
)

// RegisterHealthRoutes registers the health check routes
func RegisterHealthRoutes(router *gin.Engine) {
	// Create health controller
	healthController := controllers.NewHealthController()

	// Create health routes
	router.GET("/health", healthController.Check)
} 