package config

import (
	"fmt"
	"os"

	"mentorback/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDatabase initializes and returns a database connection
func InitDatabase() (*gorm.DB, error) {
	// Get database connection details from environment variables
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSL_MODE")

	// Default values if environment variables are not set
	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "4200"
	}
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	// Create connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	// Open connection to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	fmt.Println("PostgreSQL connection has been established successfully.")
	return db, nil
}

// MigrateDatabase automatically migrates the database schema
func MigrateDatabase(db *gorm.DB) error {
	fmt.Println("Starting database migration...")

	// Add all models that should be auto-migrated here
	err := db.AutoMigrate(
		&models.User{},
		&models.Mentor{},
		&models.Admin{},
		&models.Roadmap{},
		&models.RoadmapStep{},
		&models.ChatSession{},
		&models.ChatMessage{},
		&models.PersonalizedContent{},
		&models.UserProgress{},
	)

	if err != nil {
		return err
	}

	fmt.Println("Database migration completed successfully.")
	return nil
}
