package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"mentorback/models"

	"github.com/gin-gonic/gin"
)

// ContentController handles personalized content requests
type ContentController struct {
	BaseController
}

// NewContentController creates a new content controller
func NewContentController(base BaseController) *ContentController {
	return &ContentController{BaseController: base}
}

// PersonalizedContentRequest represents the personalized content request body
type PersonalizedContentRequest struct {
	ContentType string `json:"contentType" binding:"required"`
}

// PersonalizedContent generates personalized content for a user
func (cc *ContentController) PersonalizedContent(c *gin.Context) {
	var request PersonalizedContentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (if it exists)
	var userData models.User
	var userID uint
	shouldGenerateNew := true
	var existingTopics []models.RecommendedTopic

	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
		userID = userData.ID

		// Check if we already have saved content for this user and content type
		var existingContent models.PersonalizedContent
		result := cc.DB.Where("user_id = ? AND content_type = ?", userID, request.ContentType).
			Order("created_at DESC").
			First(&existingContent)

		if result.Error == nil {
			// If content exists and was created less than 1 day ago, use it
			oneDayAgo := time.Now().Add(-24 * time.Hour)
			if existingContent.CreatedAt.After(oneDayAgo) && len(existingContent.RecommendedTopics) > 0 {
				shouldGenerateNew = false
				existingTopics = existingContent.RecommendedTopics
			}
		}
	} else {
		// For testing without authentication, use default data
		userData = models.User{
			OnboardingData: models.OnboardingData{
				Age:           "25",
				Experience:    "intermediate",
				Interests:     []string{"programming", "web development", "AI"},
				Goals:         []string{"learn new skills", "career growth"},
				LearningStyle: "visual",
				Completed:     true,
			},
		}
	}

	// If we have existing content and don't need to generate new content
	if !shouldGenerateNew {
		c.JSON(http.StatusOK, gin.H{"recommendedTopics": existingTopics})
		return
	}

	// Handle different content types
	if request.ContentType == "recommended-topics" {
		topics, err := cc.generateRecommendedTopicsWithFallback(userData)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating recommended topics: " + err.Error()})
			return
		}

		// Send response to client
		c.JSON(http.StatusOK, gin.H{"recommendedTopics": topics})

		// Save to database if user is authenticated
		if exists {
			cc.saveRecommendedTopics(userID, request.ContentType, topics)
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content type"})
	}
}

// generateRecommendedTopicsWithFallback attempts to generate recommended topics with fallback strategies
func (cc *ContentController) generateRecommendedTopicsWithFallback(userData models.User) ([]models.RecommendedTopic, error) {
	// Create primary prompt
	prompt := fmt.Sprintf(`You are an AI learning assistant for %s level.
User is %s years old, interested in: %s.
Learning goals: %s.
Preferred learning style: %s.

Suggest 3 specific topics to study that match the user's profile and interests.
For each topic, provide a short title (up to 5 words) and brief description (up to 25 words) and duration in weeks (Number and week).

Response must be strictly in JSON format:
[
  {"title": "Topic title 1", "description": "Brief description 1", "duration": "Duration in weeks"},
  {"title": "Topic title 2", "description": "Brief description 2", "duration": "Duration in weeks"},
  {"title": "Topic title 3", "description": "Brief description 3", "duration": "Duration in weeks"}
]`,
		userData.OnboardingData.Experience,
		userData.OnboardingData.Age,
		strings.Join(userData.OnboardingData.Interests, ", "),
		strings.Join(userData.OnboardingData.Goals, ", "),
		userData.OnboardingData.LearningStyle)

	// Try primary generation
	content, err := cc.CallOpenAI(prompt)
	if err == nil {
		topics, parseErr := cc.parseRecommendedTopics(content)
		if parseErr == nil && len(topics) > 0 {
			return topics, nil
		}
	}

	fmt.Printf("Primary topic generation failed: %v. Trying fallback strategy.\n", err)

	// Fallback strategy: Simplified prompt
	var fallbackPrompt string
	if len(userData.OnboardingData.Interests) > 0 {
		// Use the first interest for a simplified recommendation
		primaryInterest := userData.OnboardingData.Interests[0]
		fallbackPrompt = fmt.Sprintf(`Suggest 2 learning topics about %s in JSON format:
[{"title":"Title","description":"Description","duration":"2 weeks"}]`, primaryInterest)
	} else {
		// Generic fallback if no interests are available
		fallbackPrompt = `Suggest 2 popular tech learning topics in JSON format:
[{"title":"Title","description":"Description","duration":"2 weeks"}]`
	}

	content, err = cc.CallOpenAI(fallbackPrompt)
	if err == nil {
		topics, parseErr := cc.parseRecommendedTopics(content)
		if parseErr == nil && len(topics) > 0 {
			return topics, nil
		}
	}

	// Last resort fallback - provide default topics
	fmt.Println("Fallback topic generation failed too. Using default topics.")

	var interests string
	if len(userData.OnboardingData.Interests) > 0 {
		interests = userData.OnboardingData.Interests[0]
	} else {
		interests = "technology"
	}

	return []models.RecommendedTopic{
		{
			Title:       fmt.Sprintf("Introduction to %s", interests),
			Description: fmt.Sprintf("Learn the fundamentals of %s for beginners", interests),
			Duration:    "2 weeks",
		},
		{
			Title:       "Web Development Basics",
			Description: "HTML, CSS, and JavaScript fundamentals",
			Duration:    "3 weeks",
		},
	}, nil
}

// parseRecommendedTopics parses the API response into recommended topics
func (cc *ContentController) parseRecommendedTopics(content string) ([]models.RecommendedTopic, error) {
	// Extract JSON from response
	jsonStr := ExtractJSON(content)
	if jsonStr == "" {
		return nil, fmt.Errorf("invalid JSON format for recommended topics")
	}

	// Parse recommended topics
	var recommendedTopics []models.RecommendedTopic
	err := json.Unmarshal([]byte(jsonStr), &recommendedTopics)
	if err != nil {
		return nil, fmt.Errorf("error parsing recommended topics: %v", err)
	}

	if len(recommendedTopics) == 0 {
		return nil, fmt.Errorf("no topics were generated")
	}

	return recommendedTopics, nil
}

// saveRecommendedTopics saves the generated topics to the database
func (cc *ContentController) saveRecommendedTopics(userID uint, contentType string, topics []models.RecommendedTopic) {
	// Create personalized content to save
	personalizedContent := models.PersonalizedContent{
		UserID:            userID,
		ContentType:       contentType,
		RecommendedTopics: topics,
	}

	// Delete old entries of the same type to save space
	cc.DB.Where("user_id = ? AND content_type = ?", userID, contentType).Delete(&models.PersonalizedContent{})

	// Save new content
	cc.DB.Create(&personalizedContent)
}
