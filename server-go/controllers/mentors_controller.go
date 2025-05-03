package controllers

import (
	"fmt"
	"net/http"
	
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/models"
)

// MentorsController handles mentor listing operations
type MentorsController struct {
	DB *gorm.DB
}

// NewMentorsController creates a new mentors controller
func NewMentorsController(db *gorm.DB) *MentorsController {
	return &MentorsController{DB: db}
}

// MentorsResponse represents the response for listing mentors
type MentorsResponse struct {
	Success bool            `json:"success"`
	Data    MentorsDataResponse `json:"data"`
}

// MentorsDataResponse contains the list of mentors
type MentorsDataResponse struct {
	Mentors []MentorPublicProfile `json:"mentors"`
}

// MentorPublicProfile represents the public profile of a mentor
type MentorPublicProfile struct {
	ID                uint     `json:"id"`
	UserID            uint     `json:"user_id"`
	Name              string   `json:"name"`
	Email             string   `json:"email"`
	Bio               string   `json:"bio"`
	Skills            []string `json:"skills"`
	Specializations   []string `json:"specializations"`
	Languages         []string `json:"languages"`
	Experience        string   `json:"experience"`
	HourlyRate        float32  `json:"hourly_rate"`
	Rating            float32  `json:"rating"`
	AvatarURL         string   `json:"avatar_url"`
	Website           string   `json:"website"`
	GitHub            string   `json:"github"`
	LinkedIn          string   `json:"linkedin"`
	Available         bool     `json:"available"`
}

// GetMentors retrieves all mentors from the database
func (mc *MentorsController) GetMentors(c *gin.Context) {
	fmt.Println("Getting mentors from database...")
	var mentors []models.Mentor
	
	// Query mentors from database
	result := mc.DB.Find(&mentors)
	if result.Error != nil {
		fmt.Printf("Error retrieving mentors: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mentors"})
		return
	}
	
	fmt.Printf("Found %d mentors in database\n", len(mentors))
	
	// Get user data for each mentor
	var mentorProfiles []MentorPublicProfile
	for i, mentor := range mentors {
		fmt.Printf("Processing mentor %d: %s (ID: %d, UserID: %d)\n", i+1, mentor.Name, mentor.ID, mentor.UserID)
		
		var user models.User
		if err := mc.DB.First(&user, mentor.UserID).Error; err != nil {
			fmt.Printf("Error retrieving user data for mentor %d: %v\n", mentor.ID, err)
			// Skip mentors with missing user data
			continue
		}
		
		// Get social links
		website := ""
		github := ""
		linkedin := ""
		
		if mentor.SocialLinks.Website != "" {
			website = mentor.SocialLinks.Website
		}
		if mentor.SocialLinks.GitHub != "" {
			github = mentor.SocialLinks.GitHub
		}
		if mentor.SocialLinks.LinkedIn != "" {
			linkedin = mentor.SocialLinks.LinkedIn
		}
		
		profile := MentorPublicProfile{
			ID:              mentor.ID,
			UserID:          mentor.UserID,
			Name:            mentor.Name,
			Email:           mentor.Email,
			Bio:             mentor.Bio,
			Skills:          []string(mentor.Skills),
			Specializations: []string(mentor.Specializations),
			Languages:       []string(mentor.Languages),
			Experience:      mentor.Experience,
			HourlyRate:      mentor.HourlyRate,
			Rating:          mentor.Rating,
			AvatarURL:       user.AvatarURL,
			Website:         website,
			GitHub:          github,
			LinkedIn:        linkedin,
			Available:       mentor.Available,
		}
		
		mentorProfiles = append(mentorProfiles, profile)
	}
	
	fmt.Printf("Returning %d mentor profiles\n", len(mentorProfiles))
	
	response := MentorsResponse{
		Success: true,
		Data: MentorsDataResponse{
			Mentors: mentorProfiles,
		},
	}
	
	c.JSON(http.StatusOK, response)
} 