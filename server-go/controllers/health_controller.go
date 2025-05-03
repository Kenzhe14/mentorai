package controllers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// HealthController handles health check endpoints
type HealthController struct {}

// NewHealthController creates a new health controller
func NewHealthController() *HealthController {
	return &HealthController{}
}

// Check responds with a simple OK status for health checking
func (hc *HealthController) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"message": "Service is healthy",
	})
} 