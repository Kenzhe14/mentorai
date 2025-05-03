package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
	"mentorback/models"
)

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID uint   `json:"userId"`
	Type   string `json:"type"` // "user" or "mentor"
	jwt.RegisteredClaims
}

// Auth middleware for user authentication
func Auth(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string
		
		// Try to get token from cookie first
		cookie, err := c.Cookie("auth_token")
		if err == nil && cookie != "" {
			tokenString = cookie
		} else {
			// Fallback to Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
				c.Abort()
				return
			}

			// Check if the header format is correct
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
				c.Abort()
				return
			}
			tokenString = parts[1]
		}

		// Parse and validate the token
		claims, err := validateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": fmt.Sprintf("Invalid token: %v", err)})
			c.Abort()
			return
		}

		// Determine the user type from token claims
		userType := claims.Type
		if userType == "" {
			userType = "user" // Default for backward compatibility
		}

		// Authenticate based on type
		if userType == "mentor" {
			// Find the mentor in the database
			var mentor models.Mentor
			result := db.First(&mentor, claims.UserID)
			if result.Error != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Mentor not found"})
				c.Abort()
				return
			}
			
			// Set the mentor in the context
			c.Set("user", mentor) // For backward compatibility
			c.Set("mentor", mentor)
			c.Set("userType", "mentor")
		} else {
			// Find the user in the database
			var user models.User
			result := db.First(&user, claims.UserID)
			if result.Error != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				c.Abort()
				return
			}
			
			// Set the user in the context
			c.Set("user", user)
			c.Set("userType", "user")
		}
		
		c.Next()
	}
}

// OptionalAuth middleware tries to authenticate a user but continues even if authentication fails
func OptionalAuth(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string
		
		// Try to get token from cookie first
		cookie, err := c.Cookie("auth_token")
		if err == nil && cookie != "" {
			tokenString = cookie
		} else {
			// Fallback to Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				// No token provided, continue without authentication
				fmt.Println("INFO: No authentication token provided for optional auth")
				c.Next()
				return
			}

			// Check if the header format is correct
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				// Invalid format, continue without authentication
				fmt.Println("WARNING: Invalid authorization header format for optional auth")
				c.Next()
				return
			}
			tokenString = parts[1]
		}

		// Parse and validate the token
		claims, err := validateToken(tokenString)
		if err != nil {
			// Invalid token, continue without authentication
			fmt.Printf("WARNING: Invalid token for optional auth: %v\n", err)
			c.Next()
			return
		}

		// Determine the user type from token claims
		userType := claims.Type
		if userType == "" {
			userType = "user" // Default for backward compatibility
		}

		// Authenticate based on type
		if userType == "mentor" {
			// Find the mentor in the database
			var mentor models.Mentor
			result := db.First(&mentor, claims.UserID)
			if result.Error != nil {
				// Mentor not found, continue without authentication
				fmt.Printf("WARNING: Mentor not found for optional auth: %v\n", result.Error)
				c.Next()
				return
			}
			
			// Set the mentor in the context
			c.Set("user", mentor) // For backward compatibility
			c.Set("mentor", mentor)
			c.Set("userType", "mentor")
		} else {
			// Find the user in the database
			var user models.User
			result := db.First(&user, claims.UserID)
			if result.Error != nil {
				// User not found, continue without authentication
				fmt.Printf("WARNING: User not found for optional auth: %v\n", result.Error)
				c.Next()
				return
			}
			
			// Set the user in the context
			c.Set("user", user)
			c.Set("userType", "user")
		}
		
		c.Next()
	}
}

// SetAuthCookie sets the authentication cookie with JWT token
func SetAuthCookie(c *gin.Context, userID uint, userType string) error {
	token, err := GenerateToken(userID, userType)
	if err != nil {
		return err
	}
	
	// Set cookie with token
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"auth_token", 
		token, 
		60*60*24*30, // 30 days in seconds
		"/", 
		"", 
		false, // secure should be true in production with HTTPS
		true, // HttpOnly to prevent JS access
	)
	
	return nil
}

// ClearAuthCookie clears the authentication cookie
func ClearAuthCookie(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		"auth_token", 
		"", 
		-1, // negative MaxAge = delete cookie
		"/", 
		"", 
		false,
		true,
	)
}

// Generate a JWT token
func GenerateToken(userID uint, userType string) (string, error) {
	// Set token claims
	claims := JWTClaims{
		UserID: userID,
		Type:   userType, // "user" or "mentor"
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * 30)), // 30 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", errors.New("JWT_SECRET environment variable is not set")
	}
	
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// Validate a JWT token
func validateToken(tokenString string) (*JWTClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Return the secret key
		secretKey := os.Getenv("JWT_SECRET")
		if secretKey == "" {
			return nil, errors.New("JWT_SECRET environment variable is not set")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	// Extract and validate claims
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token claims")
} 