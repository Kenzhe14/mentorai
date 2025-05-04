package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"mentorback/models"

	"github.com/gin-gonic/gin"
)

// ChatController handles chat-related API requests
type ChatController struct {
	BaseController
}

// NewChatController creates a new chat controller
func NewChatController(base BaseController) *ChatController {
	return &ChatController{BaseController: base}
}

// ChatRequest represents a chat message request
type ChatRequest struct {
	Message   string `json:"message" binding:"required"`
	SessionID uint   `json:"sessionId"`
}

// SendChatMessage processes and responds to user chat messages
func (cc *ChatController) SendChatMessage(c *gin.Context) {
	var request ChatRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Create or retrieve chat session
	var chatSession models.ChatSession
	var isNewSession bool

	if request.SessionID == 0 {
		// Create new chat session
		chatSession = models.ChatSession{
			UserID: userData.ID,
			Title:  "Chat Session",
		}
		if err := cc.DB.Create(&chatSession).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chat session"})
			return
		}
		isNewSession = true
	} else {
		// Get existing chat session
		if err := cc.DB.Where("id = ? AND user_id = ?", request.SessionID, userData.ID).First(&chatSession).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Chat session not found"})
			return
		}
	}

	// Save user message
	userMessage := models.ChatMessage{
		SessionID:  chatSession.ID,
		SenderType: "user",
		Content:    request.Message,
		SenderID:   userData.ID,
		Status:     models.MessageStatusSent,
		IsRead:     true,
	}
	if err := cc.DB.Create(&userMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user message"})
		return
	}

	// Get user learning preferences from onboarding data
	var learningStyle string = "general"
	var experience string = "beginner"
	var interests []string = []string{"programming"}

	if userData.OnboardingData.LearningStyle != "" {
		learningStyle = userData.OnboardingData.LearningStyle
	}

	if userData.OnboardingData.Experience != "" {
		experience = userData.OnboardingData.Experience
	}

	if len(userData.OnboardingData.Interests) > 0 {
		interests = userData.OnboardingData.Interests
	}

	// Retrieve previous messages for context (limit to last 5)
	var previousMessages []models.ChatMessage
	if !isNewSession {
		cc.DB.Where("session_id = ?", chatSession.ID).Order("created_at DESC").Limit(10).Find(&previousMessages)
	}

	// Build conversation context
	conversationContext := ""
	if len(previousMessages) > 0 {
		// Reverse order to get chronological
		for i := len(previousMessages) - 1; i >= 0; i-- {
			msg := previousMessages[i]
			if msg.SenderType == "user" {
				conversationContext += "User: " + msg.Content + "\n"
			} else {
				conversationContext += "Mentor&AI: " + msg.Content + "\n"
			}
		}
	}

	// Generate AI response with enhanced prompt
	prompt := `You are Mentor&AI, an educational AI mentor specializing in helping people learn programming and technology.

User Profile:
- Learning Style: ` + learningStyle + `
- Experience Level: ` + experience + `
- Interests: ` + fmt.Sprintf("%v", interests) + `
- Name: ` + userData.DisplayName + `

Previous conversation:
` + conversationContext + `

Current message: ` + request.Message + `

Respond as Mentor&AI in a helpful, educational, and engaging way. Be concise but thorough in your explanations. When providing code examples, ensure they are correct and well-formatted. Address the user by name occasionally to personalize the experience.`

	aiResponse, err := cc.CallOpenAI(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate AI response: " + err.Error()})
		return
	}

	// Save AI response
	assistantMessage := models.ChatMessage{
		SessionID:  chatSession.ID,
		SenderType: "ai",
		Content:    aiResponse,
		SenderID:   0, // AI has no user ID
		Status:     models.MessageStatusSent,
		IsRead:     false,
	}
	if err := cc.DB.Create(&assistantMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save assistant message"})
		return
	}

	// Update session title for new sessions after first exchange
	if isNewSession {
		// Generate a title based on the conversation
		titlePrompt := "Based on this user message, generate a very short title (5 words max) that describes the topic of conversation: " + request.Message
		title, err := cc.CallOpenAI(titlePrompt)
		if err == nil && title != "" {
			chatSession.Title = title
			cc.DB.Save(&chatSession)
		}
	}

	// Return response
	c.JSON(http.StatusOK, gin.H{
		"sessionId": chatSession.ID,
		"message":   aiResponse,
	})
}

// GetChatSessions retrieves all chat sessions for a user
func (cc *ChatController) GetChatSessions(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Get all chat sessions for the user
	var chatSessions []models.ChatSession
	if err := cc.DB.Where("user_id = ?", userData.ID).Order("updated_at DESC").Find(&chatSessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat sessions"})
		return
	}

	// Format sessions with additional data
	var formattedSessions []gin.H
	for _, session := range chatSessions {
		// Count unread messages
		var unreadCount int64
		cc.DB.Model(&models.ChatMessage{}).
			Where("session_id = ? AND sender_type = ? AND is_read = ?", session.ID, "ai", false).
			Count(&unreadCount)

		// Get last message
		var lastMessage models.ChatMessage
		cc.DB.Where("session_id = ?", session.ID).Order("created_at DESC").Limit(1).First(&lastMessage)

		// Create formatted session
		formattedSession := gin.H{
			"ID":              session.ID,
			"Title":           session.Title,
			"CreatedAt":       session.CreatedAt,
			"UpdatedAt":       session.UpdatedAt,
			"UnreadCount":     unreadCount,
			"LastMessage":     lastMessage.Content,
			"LastMessageType": lastMessage.SenderType,
		}

		// Truncate last message if too long
		if len(lastMessage.Content) > 50 {
			formattedSession["LastMessage"] = lastMessage.Content[:47] + "..."
		}

		formattedSessions = append(formattedSessions, formattedSession)
	}

	c.JSON(http.StatusOK, gin.H{"sessions": formattedSessions})
}

// GetChatHistory retrieves the chat history for a specific session
func (cc *ChatController) GetChatHistory(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Get session ID from URL parameter
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Verify the session belongs to the user
	var chatSession models.ChatSession
	if err := cc.DB.Where("id = ? AND user_id = ?", sessionID, userData.ID).First(&chatSession).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat session not found"})
		return
	}

	// Get all messages for the session
	var chatMessages []models.ChatMessage
	if err := cc.DB.Where("session_id = ?", sessionID).Order("created_at ASC").Find(&chatMessages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat messages"})
		return
	}

	// Mark unread messages as read
	if len(chatMessages) > 0 {
		cc.DB.Model(&models.ChatMessage{}).
			Where("session_id = ? AND sender_type = ? AND is_read = ?", sessionID, "ai", false).
			Updates(map[string]interface{}{"is_read": true})
	}

	// Format messages for the frontend
	var formattedMessages []gin.H
	for _, msg := range chatMessages {
		formattedMsg := gin.H{
			"ID":         msg.ID,
			"SenderType": msg.SenderType,
			"Content":    msg.Content,
			"CreatedAt":  msg.CreatedAt,
			"IsRead":     msg.IsRead,
		}
		formattedMessages = append(formattedMessages, formattedMsg)
	}

	c.JSON(http.StatusOK, gin.H{
		"session": gin.H{
			"ID":        chatSession.ID,
			"Title":     chatSession.Title,
			"CreatedAt": chatSession.CreatedAt,
			"UpdatedAt": chatSession.UpdatedAt,
		},
		"messages": formattedMessages,
		"user": gin.H{
			"ID":          userData.ID,
			"Username":    userData.Username,
			"DisplayName": userData.DisplayName,
			"AvatarURL":   userData.AvatarURL,
		},
	})
}

// DeleteAllChats deletes all chat sessions for a user
func (cc *ChatController) DeleteAllChats(c *gin.Context) {
	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userData := user.(models.User)

	// Begin a transaction
	tx := cc.DB.Begin()

	// Find all user's sessions
	var sessions []models.ChatSession
	if err := tx.Where("user_id = ?", userData.ID).Find(&sessions).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat sessions"})
		return
	}

	// Extract session IDs
	var sessionIDs []uint
	for _, session := range sessions {
		sessionIDs = append(sessionIDs, session.ID)
	}

	// If user has sessions
	if len(sessionIDs) > 0 {
		// Delete all messages for the sessions
		if err := tx.Where("session_id IN (?)", sessionIDs).Delete(&models.ChatMessage{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat messages"})
			return
		}

		// Delete all sessions
		if err := tx.Where("user_id = ?", userData.ID).Delete(&models.ChatSession{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat sessions"})
			return
		}
	}

	// Commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "All chat sessions deleted successfully"})
}
