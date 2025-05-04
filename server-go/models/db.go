package models

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// connectDB establishes connection to the database
func connectDB() (*gorm.DB, error) {
	// Get database connection details from environment variables or use defaults
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "mentorai")

	// Build connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	// Open connection to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

// Helper function to get environment variable with fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// SetupDB prepares the database for use
func SetupDB() (*gorm.DB, error) {
	// Initialize the database connection
	db, err := connectDB()
	if err != nil {
		return nil, err
	}

	// Migrate the schema - only include models that are defined
	err = db.AutoMigrate(
		&User{},
		&Roadmap{},
		&UserProgress{},
		&Analytics{},
		&TopicInteraction{},
		&ActivityLog{},
		&DailyActivity{},
		&ChatSession{},
		&ChatMessage{},
		&Admin{},
		&Mentor{},
	)
	if err != nil {
		return nil, err
	}

	// Create Super Admin if it doesn't exist
	if err := createSuperAdmin(db); err != nil {
		return nil, err
	}

	return db, nil
}
