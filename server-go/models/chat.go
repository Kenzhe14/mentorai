package models

import (
	"time"
	"gorm.io/gorm"
)

// ChatType represents the type of chat
type ChatType string

const (
	ChatTypeAI     ChatType = "ai"       // Chat with AI
	ChatTypeMentor ChatType = "mentor"   // Chat with mentor
)

// MessageStatus represents the status of a message
type MessageStatus string

const (
	MessageStatusSent      MessageStatus = "sent"       // Message was sent
	MessageStatusDelivered MessageStatus = "delivered"  // Message was delivered
	MessageStatusRead      MessageStatus = "read"       // Message was read
)

// ChatSession represents a conversation session between users or with AI
type ChatSession struct {
	gorm.Model
	UserID      uint      `json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	MentorID    *uint     `json:"mentorId,omitempty"`
	Mentor      *Mentor   `gorm:"foreignKey:MentorID" json:"-"`
	Type        ChatType  `gorm:"size:20;not null;default:'ai'" json:"type"`
	Title       string    `gorm:"size:100" json:"title"`
	Messages    []ChatMessage `gorm:"foreignKey:SessionID" json:"messages"`
	IsActive    bool      `gorm:"not null;default:true" json:"isActive"`
	LastAccess  time.Time `gorm:"not null" json:"lastAccess"`
	LastMessage string    `gorm:"size:255" json:"lastMessage"`
	UnreadCount int       `gorm:"not null;default:0" json:"unreadCount"`
}

// ChatMessage represents a single message in a chat conversation
type ChatMessage struct {
	gorm.Model
	SessionID   uint          `json:"sessionId"`
	Session     ChatSession   `gorm:"foreignKey:SessionID" json:"-"`
	Content     string        `gorm:"type:text;not null" json:"content"`
	SenderID    uint          `json:"senderId"`
	SenderType  string        `gorm:"size:20;not null" json:"senderType"` // "user" or "mentor" or "ai"
	Status      MessageStatus `gorm:"size:20;not null;default:'sent'" json:"status"`
	Timestamp   time.Time     `gorm:"not null" json:"timestamp"`
	IsRead      bool          `gorm:"not null;default:false" json:"isRead"`
}

// BeforeCreate sets the timestamp before creating a chat message
func (cm *ChatMessage) BeforeCreate(tx *gorm.DB) error {
	cm.Timestamp = time.Now()
	return nil
}

// BeforeCreate sets the last access time before creating a chat session
func (cs *ChatSession) BeforeCreate(tx *gorm.DB) error {
	cs.LastAccess = time.Now()
	return nil
}

// UpdateLastAccess updates the last access time of a chat session
func (cs *ChatSession) UpdateLastAccess(tx *gorm.DB) error {
	cs.LastAccess = time.Now()
	return tx.Model(cs).Update("last_access", cs.LastAccess).Error
}

// MarkMessagesAsRead marks all unread messages in a session as read for a specific receiver
func (cs *ChatSession) MarkMessagesAsRead(tx *gorm.DB, receiverID uint, receiverType string) error {
	// Define the opposite sender type
	var senderType string
	if receiverType == "user" {
		senderType = "mentor"
	} else {
		senderType = "user"
	}

	// Update unread messages where the receiver is the specified user/mentor
	return tx.Model(&ChatMessage{}).
		Where("session_id = ? AND sender_type = ? AND is_read = ?", cs.ID, senderType, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"status":  MessageStatusRead,
		}).Error
}

// GetChatSessionForUserAndMentor finds or creates a chat session between a user and a mentor
func GetChatSessionForUserAndMentor(tx *gorm.DB, userID, mentorID uint) (*ChatSession, error) {
	var session ChatSession
	
	// Try to find existing session
	err := tx.Where("user_id = ? AND mentor_id = ? AND type = ?", userID, mentorID, ChatTypeMentor).
		First(&session).Error
		
	// If no session exists, create a new one
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Get user and mentor for title
			var user User
			var mentor Mentor
			
			if err := tx.First(&user, userID).Error; err != nil {
				return nil, err
			}
			if err := tx.First(&mentor, mentorID).Error; err != nil {
				return nil, err
			}
			
			// Create session title from names
			title := "Chat with " + mentor.Name
			if user.DisplayName != "" {
				title = user.DisplayName + " - " + mentor.Name
			}
			
			// Create new session
			session = ChatSession{
				UserID:     userID,
				MentorID:   &mentorID,
				Type:       ChatTypeMentor,
				Title:      title,
				IsActive:   true,
				LastAccess: time.Now(),
			}
			
			if err := tx.Create(&session).Error; err != nil {
				return nil, err
			}
			
			return &session, nil
		}
		return nil, err
	}
	
	return &session, nil
} 