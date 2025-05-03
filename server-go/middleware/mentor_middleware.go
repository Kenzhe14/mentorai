package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/models"
)

// MentorOnly middleware restricts routes to mentors only
func MentorOnly(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the user type from context
		userType, exists := c.Get("userType")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// Check if user is a mentor
		if userType != "mentor" {
			// If not already identified as mentor, try to get mentor from context
			mentor, exists := c.Get("mentor")
			if !exists {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: Mentor privileges required"})
				c.Abort()
				return
			}
			
			// Make sure it's actually a mentor
			_, ok := mentor.(models.Mentor)
			if !ok {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: Invalid mentor data"})
				c.Abort()
				return
			}
		}
		
		// Continue to the next middleware/handler
		c.Next()
	}
} 