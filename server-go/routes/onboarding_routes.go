package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/controllers"
	"mentorback/middleware"
)

// RegisterOnboardingRoutes registers the onboarding routes
func RegisterOnboardingRoutes(router *gin.Engine, db *gorm.DB) {
	// Create onboarding controller
	onboardingController := controllers.NewOnboardingController(db)

	// Create onboarding routes group
	onboardingRoutes := router.Group("/api/onboarding")
	onboardingRoutes.Use(middleware.Auth(db))
	{
		onboardingRoutes.POST("/save", onboardingController.SaveOnboarding)
		onboardingRoutes.GET("/data", onboardingController.GetOnboardingData)
		onboardingRoutes.GET("/status", onboardingController.CheckOnboardingStatus)
	}
} 