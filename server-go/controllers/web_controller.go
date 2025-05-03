package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/models"
)

// WebController handles web API requests
type WebController struct {
	DB *gorm.DB
}

// NewWebController creates a new web controller
func NewWebController(db *gorm.DB) *WebController {
	return &WebController{DB: db}
}

// PersonalizedContentRequest represents the personalized content request body
type PersonalizedContentRequest struct {
	ContentType string `json:"contentType" binding:"required"`
}

// RoadmapRequest represents the roadmap request body
type RoadmapRequest struct {
	Topic string `json:"topic" binding:"required"`
}

// RunCodeRequest represents the run code request body
type RunCodeRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"required"`
}

// AnalyzeCodeRequest represents the analyze code request body
type AnalyzeCodeRequest struct {
	Code string `json:"code" binding:"required"`
	Task string `json:"task" binding:"required"`
}

// OpenAIRequest represents a request to the OpenAI API
type OpenAIRequest struct {
	Model    string                  `json:"model"`
	Messages []OpenAIRequestMessage `json:"messages"`
}

// OpenAIRequestMessage represents a message in an OpenAI API request
type OpenAIRequestMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIResponse represents a response from the OpenAI API
type OpenAIResponse struct {
	Choices []OpenAIResponseChoice `json:"choices"`
}

// OpenAIResponseChoice represents a choice in an OpenAI API response
type OpenAIResponseChoice struct {
	Message OpenAIResponseMessage `json:"message"`
}

// OpenAIResponseMessage represents a message in an OpenAI API response
type OpenAIResponseMessage struct {
	Content string `json:"content"`
}

// ChatRequest represents a chat message request
type ChatRequest struct {
	Message   string `json:"message" binding:"required"`
	SessionID uint   `json:"sessionId"`
}

// ChatResponse represents a chat message response
type ChatResponse struct {
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	SessionID uint   `json:"sessionId"`
}

// ChatHistoryResponse represents a list of chat messages for a session
type ChatHistoryResponse struct {
	SessionID uint                `json:"sessionId"`
	Title     string              `json:"title"`
	Messages  []ChatMessageResponse `json:"messages"`
}

// ChatMessageResponse represents a chat message in the response
type ChatMessageResponse struct {
	ID         uint      `json:"id"`
	Content    string    `json:"content"`
	IsFromUser bool      `json:"isFromUser"`
	Timestamp  string    `json:"timestamp"`
}

// ChatSessionResponse represents a chat session in the response
type ChatSessionResponse struct {
	ID         uint      `json:"id"`
	Title      string    `json:"title"`
	LastAccess string    `json:"lastAccess"`
}

// ExerciseRequest represents the exercise generation request body
type ExerciseRequest struct {
	Topic string `json:"topic" binding:"required"`
}

// Exercise represents an AI-generated exercise
type Exercise struct {
	Type             string   `json:"type"`
	Difficulty       string   `json:"difficulty,omitempty"`
	LearningObjective  string   `json:"learningObjective,omitempty"`
	Question         string   `json:"question,omitempty"`
	Options          []string `json:"options,omitempty"`
	CorrectAnswer    int      `json:"correctAnswer,omitempty"`
	Explanation      string   `json:"explanation,omitempty"`
	Prompt           string   `json:"prompt,omitempty"`
	Hints            []string `json:"hints,omitempty"`
	StarterCode      string   `json:"starterCode,omitempty"`
	Solution         string   `json:"solution,omitempty"`
}

// ExerciseResponse represents the response for exercise generation
type ExerciseResponse struct {
	Exercises []Exercise `json:"exercises"`
}

// PersonalizedContent generates personalized content for a user
func (wc *WebController) PersonalizedContent(c *gin.Context) {
	var request PersonalizedContentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (if it exists)
	var userData models.User
	var userID uint
	shouldGenerateNew := true
	
	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
		userID = userData.ID
		
		// Check if we already have saved content for this user and content type
		var existingContent models.PersonalizedContent
		result := wc.DB.Where("user_id = ? AND content_type = ?", userID, request.ContentType).
			Order("created_at DESC").
			First(&existingContent)
			
		if result.Error == nil {
			// If content exists and was created less than 1 day ago, use it
			oneDayAgo := time.Now().Add(-24 * time.Hour)
			if existingContent.CreatedAt.After(oneDayAgo) {
				shouldGenerateNew = false
				c.JSON(http.StatusOK, gin.H{"recommendedTopics": existingContent.RecommendedTopics})
				return
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
	
	if !shouldGenerateNew {
		return
	}

	// Create prompt based on content type
	var prompt string
	if request.ContentType == "recommended-topics" {
		prompt = fmt.Sprintf(`You are an AI learning assistant for %s level.
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
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content type"})
		return
	}

	// Call OpenAI API
	content, err := wc.callOpenAI(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating personalized content: " + err.Error()})
		return
	}

	if request.ContentType == "recommended-topics" {
		// Extract JSON from response
		jsonStr := extractJSON(content)
		if jsonStr == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid JSON format for recommended topics"})
			return
		}

		// Parse recommended topics
		var recommendedTopics []models.RecommendedTopic
		err = json.Unmarshal([]byte(jsonStr), &recommendedTopics)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing recommended topics: " + err.Error()})
			return
		}

		// Save personalized content to database
		personalizedContent := models.PersonalizedContent{
			UserID:            userID,
			ContentType:       request.ContentType,
			RecommendedTopics: recommendedTopics,
		}
		
		// If user is authenticated, save to database
		if exists {
			// Delete old entries of the same type to save space
			wc.DB.Where("user_id = ? AND content_type = ?", userID, request.ContentType).Delete(&models.PersonalizedContent{})
			
			// Save new content
			wc.DB.Create(&personalizedContent)
		}

		c.JSON(http.StatusOK, gin.H{"recommendedTopics": recommendedTopics})
	} else {
		c.JSON(http.StatusOK, gin.H{"content": content})
	}
}

// GenerateRoadmap generates a roadmap for a topic
func (wc *WebController) GenerateRoadmap(c *gin.Context) {
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
		
		result := wc.DB.Where("user_id = ? AND topic = ?", userID, request.Topic).
			Order("created_at DESC").
			First(&existingRoadmap)
			
		if result.Error == nil {
			// If roadmap exists and was created less than 7 days ago, use it
			sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour)
			if existingRoadmap.CreatedAt.After(sevenDaysAgo) {
				fmt.Println("INFO: Using existing roadmap for topic:", request.Topic)
				wc.DB.Where("roadmap_id = ?", existingRoadmap.ID).
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

	// Generate new roadmap if needed
	if shouldGenerateNew {
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
		content, err := wc.callOpenAI(prompt)
		if err != nil {
			fmt.Println("ERROR: Failed to generate roadmap:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating roadmap: " + err.Error()})
			return
		}

		// Parse roadmap steps
		steps := strings.Split(strings.TrimSpace(content), "\n")
		// Filter out empty steps
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

		// Save roadmap to database if user is authenticated
		if exists {
			// Delete old roadmaps for the same topic to save space
			var oldRoadmaps []models.Roadmap
			wc.DB.Where("user_id = ? AND topic = ?", userID, request.Topic).Find(&oldRoadmaps)
			
			for _, oldRoadmap := range oldRoadmaps {
				wc.DB.Where("roadmap_id = ?", oldRoadmap.ID).Delete(&models.RoadmapStep{})
				wc.DB.Delete(&oldRoadmap)
			}
			
			// Create new roadmap
			roadmap := models.Roadmap{
				Topic:  request.Topic,
				UserID: userID,
			}
			
			if err := wc.DB.Create(&roadmap).Error; err != nil {
				fmt.Println("ERROR: Failed to save roadmap to database:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving roadmap: " + err.Error()})
				return
			}
			
			// Create roadmap steps
			for i, stepName := range roadmapSteps {
				roadmapStep := models.RoadmapStep{
					Name:      stepName,
					Order:     i + 1,
					RoadmapID: roadmap.ID,
				}
				wc.DB.Create(&roadmapStep)
			}
			
			fmt.Println("INFO: Saved new roadmap with", len(roadmapSteps), "steps to database")
		}
	}

	fmt.Println("INFO: Returning roadmap with", len(roadmapSteps), "steps")
	c.JSON(http.StatusOK, gin.H{"roadmap": roadmapSteps})
}

// callOpenAI calls the OpenAI API with a prompt
func (wc *WebController) callOpenAI(prompt string) (string, error) {
	// Create request body
	reqBody := OpenAIRequest{
		Model: os.Getenv("MODEL"),
		Messages: []OpenAIRequestMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	// Marshal request body to JSON
	reqJSON, err := json.Marshal(reqBody)
	if err != nil {
		fmt.Println("ERROR: Failed to marshal request body:", err)
		return "", err
	}

	// Create HTTP request
	apiURL := os.Getenv("API_URL")
	fmt.Println("INFO: Making API request to:", apiURL)
	fmt.Println("INFO: Using model:", os.Getenv("MODEL"))
	
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqJSON))
	if err != nil {
		fmt.Println("ERROR: Failed to create HTTP request:", err)
		return "", err
	}

	// Set headers
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		fmt.Println("ERROR: OPENROUTER_API_KEY is not set")
		return "", fmt.Errorf("OPENROUTER_API_KEY is not set")
	}
	
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	fmt.Println("INFO: Request headers set, sending request...")

	// Send request
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("ERROR: Failed to send HTTP request:", err)
		return "", err
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("ERROR: Failed to read response body:", err)
		return "", err
	}

	// Check status code
	fmt.Printf("INFO: API response status: %d\n", resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("ERROR: API call failed with status code %d: %s\n", resp.StatusCode, string(body))
		return "", fmt.Errorf("API call failed with status code %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var openAIResp OpenAIResponse
	err = json.Unmarshal(body, &openAIResp)
	if err != nil {
		fmt.Println("ERROR: Failed to unmarshal response:", err)
		fmt.Println("Response body:", string(body))
		return "", err
	}

	// Check if response is valid
	if len(openAIResp.Choices) == 0 {
		fmt.Println("ERROR: No choices in response")
		fmt.Println("Response body:", string(body))
		return "", fmt.Errorf("no response from API")
	}

	fmt.Println("INFO: Successfully received API response")
	return openAIResp.Choices[0].Message.Content, nil
}

// extractJSON extracts JSON from a string
func extractJSON(content string) string {
	// Find JSON array in content
	start := strings.Index(content, "[")
	end := strings.LastIndex(content, "]")
	if start == -1 || end == -1 || start > end {
		return ""
	}
	return content[start : end+1]
}

// SendChatMessage handles chat messages and returns AI responses
func (wc *WebController) SendChatMessage(c *gin.Context) {
	var request ChatRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	userData := models.User{}
	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Create or use existing session
	var session models.ChatSession
	var sessionID uint

	if request.SessionID > 0 {
		// Get existing session
		result := wc.DB.Where("id = ? AND user_id = ?", request.SessionID, userData.ID).First(&session)
		if result.Error != nil {
			// If session not found, create a new one
			if result.Error == gorm.ErrRecordNotFound {
				session = models.ChatSession{
					UserID: userData.ID,
					Title:  "Chat " + time.Now().Format("2006-01-02 15:04:05"),
				}
				if err := wc.DB.Create(&session).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat session"})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving chat session"})
				return
			}
		}
		
		// Update last access time
		session.UpdateLastAccess(wc.DB)
		sessionID = session.ID
	} else {
		// Create new session
		session = models.ChatSession{
			UserID: userData.ID,
			Title:  "Chat " + time.Now().Format("2006-01-02 15:04:05"),
		}
		if err := wc.DB.Create(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat session"})
			return
		}
		sessionID = session.ID
	}

	// Save user message to database
	userMessage := models.ChatMessage{
		SessionID:   sessionID,
		Content:     request.Message,
		SenderID:    userData.ID,
		SenderType:  "user",
		Status:      models.MessageStatusSent,
	}
	if err := wc.DB.Create(&userMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user message"})
		return
	}

	// Create prompt based on user's profile and message
	var prompt string
	if userData.OnboardingData.Completed {
		prompt = fmt.Sprintf(`You are Mentor&AI, a specialized AI mentor developed by Mentor&AI company (not by Google, OpenAI or any other company).
Always identify yourself as "Mentor&AI" or "AI-mentor from Mentor&AI" when asked about your identity.
Never mention other companies like Google, OpenAI, etc. as your creators.

User profile:
- Experience level: %s
- Interests: %s
- Learning goals: %s
- Preferred learning style: %s

Chat conversation:
User: %s

IMPORTANT INSTRUCTIONS FOR ANSWERING:
1. For simple questions (like greetings, basic facts, simple definitions, or personal questions about the user), keep responses brief and to-the-point, under 50 words.
2. For complex questions (technical subjects, programming concepts, math problems, multi-part questions) provide detailed, comprehensive answers with examples or step-by-step explanations when appropriate, up to 200 words.
3. Adjust your response length based on the complexity and depth of the question.
4. If asked about who created you or what model you are, always say you are "Mentor&AI - the proprietary AI assistant created by Mentor&AI company".`,
			userData.OnboardingData.Experience,
			strings.Join(userData.OnboardingData.Interests, ", "),
			strings.Join(userData.OnboardingData.Goals, ", "),
			userData.OnboardingData.LearningStyle,
			request.Message)
	} else {
		// Generic prompt for users without onboarding data
		prompt = fmt.Sprintf(`You are Mentor&AI, a specialized AI mentor developed by Mentor&AI company (not by Google, OpenAI or any other company).
Always identify yourself as "Mentor&AI" or "AI-mentor from Mentor&AI" when asked about your identity.
Never mention other companies like Google, OpenAI, etc. as your creators.

Chat conversation:
User: %s

IMPORTANT INSTRUCTIONS FOR ANSWERING:
1. For simple questions (like greetings, basic facts, simple definitions, or personal questions about the user), keep responses brief and to-the-point, under 50 words.
2. For complex questions (technical subjects, programming concepts, math problems, multi-part questions) provide detailed, comprehensive answers with examples or step-by-step explanations when appropriate, up to 200 words.
3. Adjust your response length based on the complexity and depth of the question.
4. If asked about who created you or what model you are, always say you are "Mentor&AI - the proprietary AI assistant created by Mentor&AI company".`, request.Message)
	}

	// Call OpenAI API
	content, err := wc.callOpenAI(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating response: " + err.Error()})
		return
	}

	// Format current time
	timestamp := time.Now().Format("15:04")

	// Save AI response to database
	aiMessage := models.ChatMessage{
		SessionID:   sessionID,
		Content:     content,
		SenderID:    0, // AI has no user ID
		SenderType:  "ai",
		Status:      models.MessageStatusSent,
	}
	if err := wc.DB.Create(&aiMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save AI response"})
		return
	}

	// If this is a new session with no title other than the default timestamp,
	// update the title based on the first exchange
	if session.Title == "Chat "+time.Now().Format("2006-01-02 15:04:05") {
		// Extract a title from the first message exchange
		title := extractTitle(request.Message, content)
		session.Title = title
		wc.DB.Model(&session).Update("title", title)
	}

	c.JSON(http.StatusOK, ChatResponse{
		Content:   content,
		Timestamp: timestamp,
		SessionID: sessionID,
	})
}

// GetChatSessions returns all chat sessions for the current user
func (wc *WebController) GetChatSessions(c *gin.Context) {
	// Get user from context
	userData := models.User{}
	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get all chat sessions for user
	var sessions []models.ChatSession
	if err := wc.DB.Where("user_id = ?", userData.ID).Order("last_access DESC").Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat sessions"})
		return
	}

	// Format response
	var response []ChatSessionResponse
	for _, session := range sessions {
		response = append(response, ChatSessionResponse{
			ID:         session.ID,
			Title:      session.Title,
			LastAccess: session.LastAccess.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"sessions": response})
}

// GetChatHistory returns all messages for a specific chat session
func (wc *WebController) GetChatHistory(c *gin.Context) {
	sessionID := c.Param("id")
	
	// Get user from context
	userData := models.User{}
	user, exists := c.Get("user")
	if exists {
		userData = user.(models.User)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get session
	var session models.ChatSession
	if err := wc.DB.Where("id = ? AND user_id = ?", sessionID, userData.ID).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat session not found"})
		return
	}

	// Update last access time
	session.UpdateLastAccess(wc.DB)

	// Get all messages for session
	var messages []models.ChatMessage
	if err := wc.DB.Where("session_id = ?", sessionID).Order("created_at ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat history"})
		return
	}

	// Format response
	var messageResponses []ChatMessageResponse
	for _, message := range messages {
		messageResponses = append(messageResponses, ChatMessageResponse{
			ID:         message.ID,
			Content:    message.Content,
			IsFromUser: message.SenderType == "user",
			Timestamp:  message.Timestamp.Format("15:04"),
		})
	}

	response := ChatHistoryResponse{
		SessionID: session.ID,
		Title:     session.Title,
		Messages:  messageResponses,
	}

	c.JSON(http.StatusOK, response)
}

// extractTitle generates a title for a chat session based on the first exchange
func extractTitle(userMessage, aiResponse string) string {
	// Use the first 30 characters of user message as title, if it's longer than 5 characters
	if len(userMessage) > 5 {
		if len(userMessage) > 30 {
			return userMessage[:30] + "..."
		}
		return userMessage
	}
	
	// If user message is too short, use current time
	return "Chat " + time.Now().Format("2006-01-02 15:04:05")
}

// GenerateExercises generates practice exercises for a topic
func (wc *WebController) GenerateExercises(c *gin.Context) {
	var request ExerciseRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Println("ERROR: Invalid request format for exercises:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if topic is provided
	if request.Topic == "" {
		fmt.Println("ERROR: Empty topic in exercise request")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Topic cannot be empty"})
		return
	}

	fmt.Println("INFO: Generating exercises for topic:", request.Topic)

	// Get user from context for authentication
	user, exists := c.Get("user")
	if !exists {
		// Check if authentication is required by environment variable
		if os.Getenv("REQUIRE_AUTH_FOR_EXERCISES") == "true" {
			fmt.Println("ERROR: User not authenticated for exercises")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required for exercise generation"})
			return
		}
		fmt.Println("WARNING: No user context for exercises, but continuing without auth")
	} else {
		// Log user details
		userData := user.(models.User)
		fmt.Printf("INFO: User ID %d requesting exercises for topic: %s\n", userData.ID, request.Topic)
	}

	// Create prompt for exercise generation
	prompt := fmt.Sprintf(`Generate a set of interactive learning exercises for the topic: "%s".

Create exactly 5 exercises divided as follows:
- 3 multiple-choice quiz questions (1 beginner, 1 intermediate, 1 advanced)
- 2 coding exercises (1 beginner, 1 intermediate)

For EACH exercise, include:
1. A specific "difficulty" level (beginner, intermediate, or advanced)
2. A clear "learningObjective" that specifies what skill/concept the exercise teaches
3. For quiz questions, include an "explanation" that explains why the correct answer is correct
4. For coding exercises, include 2-3 helpful "hints" as an array

Format your response as a valid JSON array exactly like this:
[
  {
    "type": "quiz",
    "difficulty": "beginner",
    "learningObjective": "Understand basic concept X",
    "question": "Detailed question text?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Explanation of why Option 1 is correct, with additional context"
  },
  {
    "type": "coding",
    "difficulty": "intermediate",
    "learningObjective": "Apply concept Y in a programming context",
    "prompt": "Detailed task description",
    "hints": ["First hint to help get started", "Second hint about an important detail"],
    "starterCode": "function example() {\n  // Your code here\n}",
    "solution": "function example() {\n  // Complete solution with comments\n  return 'result';\n}"
  }
]

Ensure all exercises are:
1. Educational and accurate
2. Clear in their instructions
3. Progressively challenging
4. Well-structured for learning %s

The response must be VALID JSON without ANY explanation text before or after.`, request.Topic, request.Topic)

	// Call OpenAI API
	content, err := wc.callOpenAI(prompt)
	if err != nil {
		fmt.Println("ERROR: Failed to generate exercises:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating exercises: " + err.Error()})
		return
	}

	// Clean up the response to ensure it's valid JSON
	content = strings.TrimSpace(content)
	
	// Sometimes the API returns markdown code blocks, so remove them if present
	if strings.HasPrefix(content, "```json") {
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimSuffix(content, "```")
	} else if strings.HasPrefix(content, "```") {
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
	}
	
	content = strings.TrimSpace(content)

	// Parse the exercises
	var exercises []Exercise
	err = json.Unmarshal([]byte(content), &exercises)
	if err != nil {
		fmt.Println("ERROR: Failed to parse exercises:", err)
		fmt.Println("Response content:", content)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing exercises: " + err.Error()})
		return
	}

	// Validate exercises
	if len(exercises) == 0 {
		fmt.Println("ERROR: No exercises were generated")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No exercises were generated"})
		return
	}

	// Validate individual exercises have required fields
	for i, exercise := range exercises {
		if exercise.Type == "quiz" {
			if exercise.Question == "" || len(exercise.Options) < 2 || exercise.CorrectAnswer < 0 {
				fmt.Printf("WARNING: Quiz exercise at index %d is incomplete, skipping\n", i)
				continue
			}
		} else if exercise.Type == "coding" {
			if exercise.Prompt == "" || exercise.StarterCode == "" || exercise.Solution == "" {
				fmt.Printf("WARNING: Coding exercise at index %d is incomplete, skipping\n", i)
				continue
			}
		}
	}

	fmt.Println("INFO: Successfully generated", len(exercises), "exercises")
	
	// Respond with consistent format expected by frontend
	c.JSON(http.StatusOK, gin.H{"exercises": exercises})
}

// LectureRequest represents the lecture generation request body
type LectureRequest struct {
	Topic string `json:"topic" binding:"required"`
}

// LectureModule represents a single section/module of a lecture
type LectureModule struct {
	Title       string `json:"title"`
	Content     string `json:"content"`
	OrderIndex  int    `json:"orderIndex"`
}

// Lecture represents an AI-generated lecture with a modular structure
type Lecture struct {
	ID           string             `json:"id"`
	Title        string             `json:"title"`
	Description  string             `json:"description"`
	Modules      []LectureModule    `json:"modules"`
	Exercises    []Exercise         `json:"exercises,omitempty"`
	Resources    []LectureResource  `json:"resources,omitempty"`
	EstimatedTime string            `json:"estimatedTime"`
	Difficulty   string             `json:"difficulty"`
	Keywords     []string           `json:"keywords,omitempty"`
}

// LectureResource represents a resource for a lecture
type LectureResource struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Type  string `json:"type"`
	Description string `json:"description,omitempty"`
}

// GenerateLecture generates a lecture for a topic, either as a continuous document or in a modular format
func (wc *WebController) GenerateLecture(c *gin.Context) {
	var request LectureRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Determine which lecture format to generate based on request path
	path := c.Request.URL.Path
	isModular := strings.Contains(path, "/lecture/modular")

	if isModular {
		wc.generateModularLecture(c, request)
	} else {
		wc.generateContinuousLecture(c, request)
	}
}

// generateContinuousLecture generates a lecture as a continuous HTML document
func (wc *WebController) generateContinuousLecture(c *gin.Context, request LectureRequest) {
	fmt.Println("INFO: Generating continuous lecture for topic:", request.Topic)

	// Create prompt for lecture generation
	prompt := fmt.Sprintf(`Generate a comprehensive educational lecture on the topic: "%s".

The lecture should follow this structure:
1. Introduction to %s
2. Key concepts and principles
3. Practical applications
4. Advanced topics (if applicable)
5. Summary

Format your response as HTML and include:
- Clear headings (h2, h3) to structure the content
- Code examples where relevant (using <pre> and <code> tags)
- Bold text for important terms
- Bullet points or numbered lists where appropriate

The HTML should be clean and well-formatted. Include only the content without any HTML, HEAD, or BODY tags.
Focus on providing accurate, educational content suitable for adult learners.

Also provide 3 recommended resources on this topic in the following JSON format:
[
  {"title": "Resource Name 1", "url": "https://example.com/resource1", "type": "article"},
  {"title": "Resource Name 2", "url": "https://example.com/resource2", "type": "video"},
  {"title": "Resource Name 3", "url": "https://github.com/example/repo", "type": "github"}
]

Clearly separate the HTML content and the JSON resources in your response with a special marker: "===RESOURCES===" 
So format should be: <HTML content> ===RESOURCES=== <JSON resources>`, request.Topic, request.Topic)

	// Call OpenAI API
	content, err := wc.callOpenAI(prompt)
	if err != nil {
		fmt.Println("ERROR: Failed to generate lecture:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating lecture: " + err.Error()})
		return
	}

	// Split the content and resources
	parts := strings.Split(content, "===RESOURCES===")
	
	var lectureContent string
	var resourcesJSON string
	
	if len(parts) >= 2 {
		lectureContent = strings.TrimSpace(parts[0])
		resourcesJSON = strings.TrimSpace(parts[1])
	} else {
		// If the marker isn't found, use all content as lecture
		lectureContent = content
		resourcesJSON = "[]"
	}
	
	// Clean up JSON data - sometimes it includes markdown code blocks
	if strings.HasPrefix(resourcesJSON, "```json") {
		resourcesJSON = strings.TrimPrefix(resourcesJSON, "```json")
		resourcesJSON = strings.TrimSuffix(resourcesJSON, "```")
	} else if strings.HasPrefix(resourcesJSON, "```") {
		resourcesJSON = strings.TrimPrefix(resourcesJSON, "```")
		resourcesJSON = strings.TrimSuffix(resourcesJSON, "```")
	}
	
	resourcesJSON = strings.TrimSpace(resourcesJSON)

	// Parse the resources
	var resources []LectureResource
	err = json.Unmarshal([]byte(resourcesJSON), &resources)
	if err != nil {
		fmt.Println("ERROR: Failed to parse resources:", err)
		fmt.Println("Resources content:", resourcesJSON)
		// Continue without resources if parsing fails
		resources = []LectureResource{}
	}

	// Generate exercises for the topic
	var exercises []Exercise
	exercisesPrompt := fmt.Sprintf(`Generate a set of learning exercises for the topic: "%s".

Create exactly 3 quiz questions and 2 coding exercises structured as follows:

For each quiz question, include:
1. A relevant question about %s
2. Four multiple-choice options
3. The index of the correct answer (0-3)

For each coding exercise, include:
1. A prompt describing a programming task relevant to %s
2. Starter code (skeleton for the solution)
3. A complete solution

Format your response as a valid JSON array exactly like this:
[
  {
    "type": "quiz",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0
  },
  {
    "type": "coding",
    "prompt": "Task description",
    "starterCode": "function example() {\n  // Your code here\n}",
    "solution": "function example() {\n  return 'Complete solution';\n}"
  }
]

Ensure all content is educational, accurate, and appropriate for learning %s.
The response must be VALID JSON without ANY explanation text before or after.`, request.Topic, request.Topic, request.Topic, request.Topic)

	exerciseContent, err := wc.callOpenAI(exercisesPrompt)
	if err != nil {
		fmt.Println("WARNING: Failed to generate exercises for lecture:", err)
		// Continue without exercises if generation fails
	} else {
		// Clean up the response to ensure it's valid JSON
		exerciseContent = strings.TrimSpace(exerciseContent)
		
		// Sometimes the API returns markdown code blocks, so remove them if present
		if strings.HasPrefix(exerciseContent, "```json") {
			exerciseContent = strings.TrimPrefix(exerciseContent, "```json")
			exerciseContent = strings.TrimSuffix(exerciseContent, "```")
		} else if strings.HasPrefix(exerciseContent, "```") {
			exerciseContent = strings.TrimPrefix(exerciseContent, "```")
			exerciseContent = strings.TrimSuffix(exerciseContent, "```")
		}
		
		exerciseContent = strings.TrimSpace(exerciseContent)

		// Parse the exercises
		err = json.Unmarshal([]byte(exerciseContent), &exercises)
		if err != nil {
			fmt.Println("ERROR: Failed to parse exercises:", err)
			// Continue without exercises if parsing fails
			exercises = []Exercise{}
		}
	}

	// Create the lecture object - for compatibility with modular format
	modules := []LectureModule{
		{
			Title:      request.Topic,
			Content:    lectureContent,
			OrderIndex: 1,
		},
	}
	
	lecture := Lecture{
		ID:            fmt.Sprintf("lecture-%d", time.Now().UnixNano()),
		Title:         request.Topic,
		Description:   "Comprehensive lecture on " + request.Topic,
		Modules:       modules,
		Resources:     resources,
		Exercises:     exercises,
		EstimatedTime: "15-20 minutes",
		Difficulty:    "intermediate",
		Keywords:      []string{request.Topic},
	}

	fmt.Println("INFO: Successfully generated continuous lecture for:", request.Topic)
	c.JSON(http.StatusOK, gin.H{"lecture": lecture})
}

// generateModularLecture generates a structured, module-based lecture for a topic
func (wc *WebController) generateModularLecture(c *gin.Context, request LectureRequest) {
	fmt.Println("INFO: Generating modular lecture for topic:", request.Topic)

	// Create prompt for lecture structure generation
	structurePrompt := fmt.Sprintf(`Create a comprehensive modular learning plan for the topic: "%s".

Respond with a structured JSON object containing:
1. A short but descriptive title for the entire lecture
2. A concise description (2-3 sentences) about what will be learned
3. Difficulty level (beginner, intermediate, or advanced)
4. Estimated time to complete (e.g., "30-45 minutes")
5. Keywords related to the topic (5-8 terms)
6. A list of 4-6 learning modules that together form a complete lesson

The response should strictly follow this JSON format:
{
  "title": "Main title for the lecture",
  "description": "Brief overview of what will be covered",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "30-45 minutes",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Brief description of module 1 content"
    },
    {
      "title": "Module 2 Title",
      "description": "Brief description of module 2 content"
    }
  ]
}

Focus on creating a logical learning sequence with clear progression from basic to advanced concepts.
The response must be VALID JSON without ANY explanation text before or after.`, request.Topic)

	// Call OpenAI API for lecture structure
	structureContent, err := wc.callOpenAI(structurePrompt)
	if err != nil {
		fmt.Println("ERROR: Failed to generate lecture structure:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating lecture structure: " + err.Error()})
		return
	}

	// Clean up the response to ensure it's valid JSON
	structureContent = strings.TrimSpace(structureContent)
	
	// Sometimes the API returns markdown code blocks, so remove them if present
	if strings.HasPrefix(structureContent, "```json") {
		structureContent = strings.TrimPrefix(structureContent, "```json")
		structureContent = strings.TrimSuffix(structureContent, "```")
	} else if strings.HasPrefix(structureContent, "```") {
		structureContent = strings.TrimPrefix(structureContent, "```")
		structureContent = strings.TrimSuffix(structureContent, "```")
	}
	
	structureContent = strings.TrimSpace(structureContent)

	// Parse the lecture structure
	type LectureStructure struct {
		Title         string `json:"title"`
		Description   string `json:"description"`
		Difficulty    string `json:"difficulty"`
		EstimatedTime string `json:"estimatedTime"`
		Keywords      []string `json:"keywords"`
		Modules       []struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		} `json:"modules"`
	}
	
	var structure LectureStructure
	err = json.Unmarshal([]byte(structureContent), &structure)
	if err != nil {
		fmt.Println("ERROR: Failed to parse lecture structure:", err)
		fmt.Println("Structure content:", structureContent)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing lecture structure: " + err.Error()})
		return
	}

	// Generate content for each module
	var modules []LectureModule
	
	for i, moduleStructure := range structure.Modules {
		// Create prompt for this specific module
		modulePrompt := fmt.Sprintf(`Create educational content for a module titled "%s" on the topic of "%s".
 
This is module %d in a sequence of %d modules.

Please provide comprehensive, well-structured HTML content that:
1. Explains concepts clearly and concisely
2. Uses examples to illustrate points
3. Includes code snippets where relevant (using <pre> and <code> tags)
4. Uses <strong> tags for important terms
5. Organizes content with <h3> and <h4> subheadings
6. Uses bullet points or numbered lists for step-by-step explanations

The content should be directly relevant to the module title and address the following description:
"%s"

Format as clean HTML without any outer <html>, <head>, or <body> tags.
Focus on accuracy, clarity, and educational value.`, 
			moduleStructure.Title, 
			request.Topic, 
			i+1, 
			len(structure.Modules),
			moduleStructure.Description)

		// Call OpenAI API for this module's content
		moduleContent, err := wc.callOpenAI(modulePrompt)
		if err != nil {
			fmt.Printf("ERROR: Failed to generate content for module %d: %v\n", i+1, err)
			// Continue with other modules if one fails
			moduleContent = fmt.Sprintf("<p>Error generating content for this module: %s</p>", err.Error())
		}

		// Add module to the list
		module := LectureModule{
			Title:      moduleStructure.Title,
			Content:    moduleContent,
			OrderIndex: i + 1,
		}
		
		modules = append(modules, module)
		fmt.Printf("INFO: Generated module %d: %s\n", i+1, moduleStructure.Title)
	}

	// Generate resources for the topic
	resourcesPrompt := fmt.Sprintf(`Provide 4 high-quality learning resources for the topic: "%s" (difficulty level: %s).

Include a variety of resource types: articles, videos, tutorials, documentation, GitHub repositories, or interactive tools.

For each resource:
1. Provide a descriptive title
2. Include a realistic and relevant URL
3. Specify the type (article, video, github, tutorial, documentation, tool)
4. Add a brief 1-sentence description of what the resource offers

Format your response as a valid JSON array:
[
  {
    "title": "Resource Title 1",
    "url": "https://example.com/resource1",
    "type": "article",
    "description": "Brief description of what this resource offers"
  },
  {
    "title": "Resource Title 2",
    "url": "https://example.com/resource2",
    "type": "video",
    "description": "Brief description of what this resource offers"
  }
]

Ensure URLs are realistic but don't need to be verified.
The response must be VALID JSON without ANY explanation text before or after.`, request.Topic, structure.Difficulty)

	// Call OpenAI API for resources
	resourcesContent, err := wc.callOpenAI(resourcesPrompt)
	if err != nil {
		fmt.Println("WARNING: Failed to generate resources for lecture:", err)
		// Continue without resources if generation fails
	}
	
	// Clean up the resources response
	resourcesContent = strings.TrimSpace(resourcesContent)
	if strings.HasPrefix(resourcesContent, "```json") {
		resourcesContent = strings.TrimPrefix(resourcesContent, "```json")
		resourcesContent = strings.TrimSuffix(resourcesContent, "```")
	} else if strings.HasPrefix(resourcesContent, "```") {
		resourcesContent = strings.TrimPrefix(resourcesContent, "```")
		resourcesContent = strings.TrimSuffix(resourcesContent, "```")
	}
	resourcesContent = strings.TrimSpace(resourcesContent)
	
	// Parse the resources
	var resources []LectureResource
	err = json.Unmarshal([]byte(resourcesContent), &resources)
	if err != nil {
		fmt.Println("ERROR: Failed to parse resources:", err)
		// Continue without resources if parsing fails
		resources = []LectureResource{}
	}

	// Generate quiz and coding exercises
	var exercises []Exercise
	exercisesPrompt := fmt.Sprintf(`Generate a set of learning exercises for the topic: "%s" (difficulty: %s).

Create exactly 3 quiz questions and 2 coding exercises structured as follows:

For each quiz question, include:
1. A relevant question about %s
2. Four multiple-choice options
3. The index of the correct answer (0-3)

For each coding exercise, include:
1. A prompt describing a programming task relevant to %s
2. Starter code (skeleton for the solution)
3. A complete solution

Format your response as a valid JSON array exactly like this:
[
  {
    "type": "quiz",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0
  },
  {
    "type": "coding",
    "prompt": "Task description",
    "starterCode": "function example() {\n  // Your code here\n}",
    "solution": "function example() {\n  return 'Complete solution';\n}"
  }
]

Ensure all content is educational, accurate, and appropriate for learning %s.
The response must be VALID JSON without ANY explanation text before or after.`, 
		request.Topic, 
		structure.Difficulty, 
		request.Topic, 
		request.Topic, 
		request.Topic)

	// Call OpenAI API for exercises
	exerciseContent, err := wc.callOpenAI(exercisesPrompt)
	if err != nil {
		fmt.Println("WARNING: Failed to generate exercises for lecture:", err)
		// Continue without exercises if generation fails
	} else {
		// Clean up the response to ensure it's valid JSON
		exerciseContent = strings.TrimSpace(exerciseContent)
		if strings.HasPrefix(exerciseContent, "```json") {
			exerciseContent = strings.TrimPrefix(exerciseContent, "```json")
			exerciseContent = strings.TrimSuffix(exerciseContent, "```")
		} else if strings.HasPrefix(exerciseContent, "```") {
			exerciseContent = strings.TrimPrefix(exerciseContent, "```")
			exerciseContent = strings.TrimSuffix(exerciseContent, "```")
		}
		exerciseContent = strings.TrimSpace(exerciseContent)

		// Parse the exercises
		err = json.Unmarshal([]byte(exerciseContent), &exercises)
		if err != nil {
			fmt.Println("ERROR: Failed to parse exercises:", err)
			// Continue without exercises if parsing fails
			exercises = []Exercise{}
		}
	}

	// Create the complete lecture object
	lecture := Lecture{
		ID:           fmt.Sprintf("lecture-%d", time.Now().UnixNano()),
		Title:        structure.Title,
		Description:  structure.Description,
		Modules:      modules,
		Resources:    resources,
		Exercises:    exercises,
		EstimatedTime: structure.EstimatedTime,
		Difficulty:   structure.Difficulty,
		Keywords:     structure.Keywords,
	}

	fmt.Println("INFO: Successfully generated modular lecture for:", request.Topic)
	c.JSON(http.StatusOK, gin.H{"lecture": lecture})
} 