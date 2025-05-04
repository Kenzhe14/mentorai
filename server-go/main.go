package main

import (
	"fmt"
	"log"
	"os"

	"mentorback/config"
	"mentorback/models"
	"mentorback/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	// Initialize database connection
	db, err := config.InitDatabase()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto-migrate the database
	if err := config.MigrateDatabase(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Fix existing null values in OnboardingData
	fixNullValues(db)

	// Set up Gin router
	router := gin.Default()

	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll("uploads/avatars", 0755); err != nil {
		log.Printf("Warning: Failed to create uploads directory: %v", err)
	}

	// Serve static files from the uploads directory
	router.Static("/uploads", "./uploads")

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Register health check routes first (no auth required)
	routes.RegisterHealthRoutes(router)

	// Register other routes
	routes.RegisterAuthRoutes(router, db)
	routes.RegisterOnboardingRoutes(router, db)
	routes.RegisterWebRoutes(router, db)
	routes.RegisterRuWebRoutes(router, db)

	// Get port from environment variable
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := router.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// fixNullValues fixes null values in OnboardingData for existing users
func fixNullValues(db *gorm.DB) {
	var users []models.User
	result := db.Find(&users)
	if result.Error != nil {
		log.Printf("Error fetching users to fix null values: %v", result.Error)
		return
	}

	for _, user := range users {
		// Ensure empty slices are initialized
		if user.OnboardingData.Interests == nil {
			user.OnboardingData.Interests = []string{}
		}
		if user.OnboardingData.Goals == nil {
			user.OnboardingData.Goals = []string{}
		}

		// Save the updated user
		if err := db.Save(&user).Error; err != nil {
			log.Printf("Error fixing null values for user %d: %v", user.ID, err)
		}
	}

	log.Printf("Fixed null values for %d users", len(users))
}
