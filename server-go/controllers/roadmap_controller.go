package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"mentorback/models"

	"github.com/gin-gonic/gin"
)

// RoadmapController handles roadmap generation requests
type RoadmapController struct {
	BaseController
}

// NewRoadmapController creates a new roadmap controller
func NewRoadmapController(base BaseController) *RoadmapController {
	return &RoadmapController{BaseController: base}
}

// RoadmapRequest represents the roadmap request body
type RoadmapRequest struct {
	Topic string `json:"topic" binding:"required"`
}

// GenerateRoadmap generates a roadmap for a topic
func (rc *RoadmapController) GenerateRoadmap(c *gin.Context) {
	var request RoadmapRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Track if we should generate a new roadmap
	shouldGenerateNew := true
	var roadmapSteps []string

	// Get user from context (if it exists)
	var userData models.User
	var userID uint

	// Check if we already have a saved roadmap for this topic and user
	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
		userID = userData.ID

		// Check for existing roadmap
		var existingRoadmap models.Roadmap
		var steps []models.RoadmapStep

		result := rc.DB.Where("user_id = ? AND topic = ?", userID, request.Topic).
			Order("created_at DESC").
			First(&existingRoadmap)

		if result.Error == nil {
			// If roadmap exists and was created less than 7 days ago, use it
			sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour)
			if existingRoadmap.CreatedAt.After(sevenDaysAgo) {
				fmt.Println("INFO: Using existing roadmap for topic:", request.Topic)
				rc.DB.Where("roadmap_id = ?", existingRoadmap.ID).
					Order("\"order\" ASC").
					Find(&steps)

				if len(steps) > 0 {
					for _, step := range steps {
						roadmapSteps = append(roadmapSteps, step.Name)
					}
					shouldGenerateNew = false
				} else {
					fmt.Println("INFO: Existing roadmap has no steps, generating new one")
				}
			}
		}
	}

	// Если у нас есть существующий контент и не нужно генерировать новый
	if !shouldGenerateNew {
		fmt.Println("INFO: Returning existing roadmap with", len(roadmapSteps), "steps")
		c.JSON(http.StatusOK, gin.H{"roadmap": roadmapSteps})
		return
	}

	// Generate new roadmap
	fmt.Println("INFO: Generating new roadmap for topic:", request.Topic)

	// Create prompt
	prompt := fmt.Sprintf(`You are an AI learning assistant. Your task is to create a clear and structured roadmap for learning "%s".

Response format:
Step name
Step name
Step name
Step name
Step name

Example for "HTML":
HTML Basics
Semantic Markup
Forms and Input
CSS Integration
Practice

Use that response format
Don't add text like "Here's the roadmap"
Don't use **asterisks**
Numbering 1-18, step — max 15 characters`, request.Topic)

	// Call OpenAI API
	content, err := rc.CallOpenAI(prompt)
	if err != nil {
		fmt.Println("ERROR: Failed to generate roadmap:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating roadmap: " + err.Error()})
		return
	}

	// Parse roadmap steps
	steps := strings.Split(strings.TrimSpace(content), "\n")
	// Filter out empty steps
	roadmapSteps = []string{} // Очищаем на всякий случай
	for _, step := range steps {
		if step != "" {
			roadmapSteps = append(roadmapSteps, step)
		}
	}

	// If no steps were generated, return an error
	if len(roadmapSteps) == 0 {
		fmt.Println("ERROR: No roadmap steps were generated")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No roadmap steps were generated"})
		return
	}

	// Сначала отправляем ответ клиенту
	fmt.Println("INFO: Returning roadmap with", len(roadmapSteps), "steps")
	c.JSON(http.StatusOK, gin.H{"roadmap": roadmapSteps})

	// Затем, если пользователь аутентифицирован, сохраняем в базу данных
	if exists {
		// Delete old roadmaps for the same topic to save space
		var oldRoadmaps []models.Roadmap
		rc.DB.Where("user_id = ? AND topic = ?", userID, request.Topic).Find(&oldRoadmaps)

		for _, oldRoadmap := range oldRoadmaps {
			rc.DB.Where("roadmap_id = ?", oldRoadmap.ID).Delete(&models.RoadmapStep{})
			rc.DB.Delete(&oldRoadmap)
		}

		// Create new roadmap
		roadmap := models.Roadmap{
			Topic:  request.Topic,
			UserID: userID,
		}

		if err := rc.DB.Create(&roadmap).Error; err != nil {
			fmt.Println("ERROR: Failed to save roadmap to database:", err)
			return // Не возвращаем ошибку клиенту, т.к. ответ уже отправлен
		}

		// Create roadmap steps
		for i, stepName := range roadmapSteps {
			roadmapStep := models.RoadmapStep{
				Name:      stepName,
				Order:     i + 1,
				RoadmapID: roadmap.ID,
			}
			rc.DB.Create(&roadmapStep)
		}

		fmt.Println("INFO: Saved new roadmap with", len(roadmapSteps), "steps to database")
	}
}
