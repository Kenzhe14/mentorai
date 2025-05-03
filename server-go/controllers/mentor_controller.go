package controllers

import (
	"fmt"
	"net/http"
	"time"
	
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"mentorback/models"
)

// MentorController handles mentor-specific operations
type MentorController struct {
	DB *gorm.DB
}

// NewMentorController creates a new mentor controller
func NewMentorController(db *gorm.DB) *MentorController {
	return &MentorController{DB: db}
}

// MentorDashboardResponse represents the mentor dashboard data
type MentorDashboardResponse struct {
	Success bool `json:"success"`
	Data    struct {
		MentorInfo       models.Mentor          `json:"mentorInfo"`
		StudentsCount    int                    `json:"studentsCount"`
		HoursCompleted   int                    `json:"hoursCompleted"`
		TotalEarnings    float32                `json:"totalEarnings"`
		UpcomingSessions []MentorSessionPreview `json:"upcomingSessions"`
	} `json:"data"`
}

// MentorSessionPreview represents a preview of a mentor session
type MentorSessionPreview struct {
	ID          uint      `json:"id"`
	StudentName string    `json:"studentName"`
	Topic       string    `json:"topic"`
	Date        time.Time `json:"date"`
	Duration    int       `json:"duration"` // in minutes
}

// MentorStudentsResponse represents the mentor students data
type MentorStudentsResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Students []MentorStudent `json:"students"`
	} `json:"data"`
}

// MentorStudent represents a student mentored by the mentor
type MentorStudent struct {
	ID            uint      `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	JoinedDate    time.Time `json:"joinedDate"`
	SessionsCount int       `json:"sessionsCount"`
	TotalHours    int       `json:"totalHours"`
	LastSession   time.Time `json:"lastSession"`
}

// StudentRoadmapsResponse represents the roadmaps for a student
type StudentRoadmapsResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Student  MentorStudent `json:"student"`
		Roadmaps []struct {
			ID        uint      `json:"id"`
			Topic     string    `json:"topic"`
			CreatedAt time.Time `json:"createdAt"`
			UpdatedAt time.Time `json:"updatedAt"`
			Steps     []struct {
				ID        uint      `json:"id"`
				Name      string    `json:"name"`
				Order     int       `json:"order"`
				Completed bool      `json:"completed"`
				CreatedAt time.Time `json:"createdAt"`
				UpdatedAt time.Time `json:"updatedAt"`
			} `json:"steps"`
		} `json:"roadmaps"`
	} `json:"data"`
}

// GetDashboardData retrieves the mentor dashboard data
func (mc *MentorController) GetDashboardData(c *gin.Context) {
	// Get the user from the context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user data"})
		return
	}
	
	// Get mentor data
	var mentor models.Mentor
	if err := mc.DB.Where("user_id = ?", currentUser.ID).First(&mentor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mentor data"})
		return
	}
	
	// Prepare response
	response := MentorDashboardResponse{Success: true}
	response.Data.MentorInfo = mentor
	
	// In a real system, we would query for real data here
	// For now, we'll use placeholder data
	response.Data.StudentsCount = 12
	response.Data.HoursCompleted = 48
	response.Data.TotalEarnings = 960
	
	// Add some sample upcoming sessions
	now := time.Now()
	response.Data.UpcomingSessions = []MentorSessionPreview{
		{
			ID:          1,
			StudentName: "Alex Smith",
			Topic:       "React Hooks",
			Date:        now.Add(24 * time.Hour),
			Duration:    60,
		},
		{
			ID:          2,
			StudentName: "Jessica Wang",
			Topic:       "JavaScript Basics",
			Date:        now.Add(72 * time.Hour),
			Duration:    90,
		},
		{
			ID:          3,
			StudentName: "Michael Brown",
			Topic:       "Advanced CSS",
			Date:        now.Add(96 * time.Hour),
			Duration:    60,
		},
	}
	
	c.JSON(http.StatusOK, response)
}

// GetStudentsData retrieves the mentor's students data
func (mc *MentorController) GetStudentsData(c *gin.Context) {
	// Get the user from the context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user data"})
		return
	}
	
	// Get mentor data
	var mentor models.Mentor
	if err := mc.DB.Where("user_id = ?", currentUser.ID).First(&mentor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mentor data"})
		return
	}
	
	// Prepare response
	response := MentorStudentsResponse{Success: true}
	
	// In a real system, we would query for real students here
	// For now, we'll use placeholder data
	now := time.Now()
	joinDate := now.Add(-90 * 24 * time.Hour) // 90 days ago
	
	response.Data.Students = []MentorStudent{
		{
			ID:            1,
			Name:          "Alex Smith",
			Email:         "alex.smith@example.com",
			JoinedDate:    joinDate,
			SessionsCount: 8,
			TotalHours:    12,
			LastSession:   now.Add(-7 * 24 * time.Hour),
		},
		{
			ID:            2,
			Name:          "Jessica Wang",
			Email:         "jessica.wang@example.com",
			JoinedDate:    joinDate.Add(15 * 24 * time.Hour),
			SessionsCount: 12,
			TotalHours:    18,
			LastSession:   now.Add(-2 * 24 * time.Hour),
		},
		{
			ID:            3,
			Name:          "Michael Brown",
			Email:         "michael.brown@example.com",
			JoinedDate:    joinDate.Add(30 * 24 * time.Hour),
			SessionsCount: 5,
			TotalHours:    7,
			LastSession:   now.Add(-10 * 24 * time.Hour),
		},
		{
			ID:            4,
			Name:          "Sarah Johnson",
			Email:         "sarah.johnson@example.com",
			JoinedDate:    joinDate.Add(45 * 24 * time.Hour),
			SessionsCount: 3,
			TotalHours:    4,
			LastSession:   now.Add(-14 * 24 * time.Hour),
		},
		{
			ID:            5,
			Name:          "David Lee",
			Email:         "david.lee@example.com",
			JoinedDate:    joinDate.Add(60 * 24 * time.Hour),
			SessionsCount: 2,
			TotalHours:    3,
			LastSession:   now.Add(-21 * 24 * time.Hour),
		},
	}
	
	c.JSON(http.StatusOK, response)
}

// GetStudentRoadmaps retrieves the roadmaps for a specific student
func (mc *MentorController) GetStudentRoadmaps(c *gin.Context) {
	// Get the user from the context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	currentUser, ok := user.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user data"})
		return
	}
	
	// Get mentor data
	var mentor models.Mentor
	if err := mc.DB.Where("user_id = ?", currentUser.ID).First(&mentor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve mentor data"})
		return
	}
	
	// Get student ID from path parameter
	studentIDStr := c.Param("studentId")
	
	// Prepare response
	response := StudentRoadmapsResponse{Success: true}
	
	// In a real system, we would query for the real student data and roadmaps
	// For now, we'll use placeholder data based on the ID
	now := time.Now()
	joinDate := now.Add(-90 * 24 * time.Hour) // 90 days ago
	
	// Find student in our sample data
	var studentFound bool
	students := []MentorStudent{
		{
			ID:            1,
			Name:          "Alex Smith",
			Email:         "alex.smith@example.com",
			JoinedDate:    joinDate,
			SessionsCount: 8,
			TotalHours:    12,
			LastSession:   now.Add(-7 * 24 * time.Hour),
		},
		{
			ID:            2,
			Name:          "Jessica Wang",
			Email:         "jessica.wang@example.com",
			JoinedDate:    joinDate.Add(15 * 24 * time.Hour),
			SessionsCount: 12,
			TotalHours:    18,
			LastSession:   now.Add(-2 * 24 * time.Hour),
		},
		{
			ID:            3,
			Name:          "Michael Brown",
			Email:         "michael.brown@example.com",
			JoinedDate:    joinDate.Add(30 * 24 * time.Hour),
			SessionsCount: 5,
			TotalHours:    7,
			LastSession:   now.Add(-10 * 24 * time.Hour),
		},
	}
	
	for _, student := range students {
		if fmt.Sprintf("%d", student.ID) == studentIDStr {
			response.Data.Student = student
			studentFound = true
			break
		}
	}
	
	if !studentFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	
	// Generate sample roadmaps for the student
	response.Data.Roadmaps = []struct {
		ID        uint      `json:"id"`
		Topic     string    `json:"topic"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
		Steps     []struct {
			ID        uint      `json:"id"`
			Name      string    `json:"name"`
			Order     int       `json:"order"`
			Completed bool      `json:"completed"`
			CreatedAt time.Time `json:"createdAt"`
			UpdatedAt time.Time `json:"updatedAt"`
		} `json:"steps"`
	}{
		{
			ID:        1,
			Topic:     "JavaScript Fundamentals",
			CreatedAt: now.Add(-60 * 24 * time.Hour),
			UpdatedAt: now.Add(-5 * 24 * time.Hour),
			Steps: []struct {
				ID        uint      `json:"id"`
				Name      string    `json:"name"`
				Order     int       `json:"order"`
				Completed bool      `json:"completed"`
				CreatedAt time.Time `json:"createdAt"`
				UpdatedAt time.Time `json:"updatedAt"`
			}{
				{
					ID:        1,
					Name:      "Variables and Data Types",
					Order:     1,
					Completed: true,
					CreatedAt: now.Add(-60 * 24 * time.Hour),
					UpdatedAt: now.Add(-55 * 24 * time.Hour),
				},
				{
					ID:        2,
					Name:      "Functions and Scope",
					Order:     2,
					Completed: true,
					CreatedAt: now.Add(-60 * 24 * time.Hour),
					UpdatedAt: now.Add(-50 * 24 * time.Hour),
				},
				{
					ID:        3,
					Name:      "Arrays and Objects",
					Order:     3,
					Completed: true,
					CreatedAt: now.Add(-60 * 24 * time.Hour),
					UpdatedAt: now.Add(-45 * 24 * time.Hour),
				},
				{
					ID:        4,
					Name:      "DOM Manipulation",
					Order:     4,
					Completed: true,
					CreatedAt: now.Add(-60 * 24 * time.Hour),
					UpdatedAt: now.Add(-40 * 24 * time.Hour),
				},
				{
					ID:        5,
					Name:      "Asynchronous JavaScript",
					Order:     5,
					Completed: false,
					CreatedAt: now.Add(-60 * 24 * time.Hour),
					UpdatedAt: now.Add(-60 * 24 * time.Hour),
				},
			},
		},
		{
			ID:        2,
			Topic:     "React Basics",
			CreatedAt: now.Add(-40 * 24 * time.Hour),
			UpdatedAt: now.Add(-3 * 24 * time.Hour),
			Steps: []struct {
				ID        uint      `json:"id"`
				Name      string    `json:"name"`
				Order     int       `json:"order"`
				Completed bool      `json:"completed"`
				CreatedAt time.Time `json:"createdAt"`
				UpdatedAt time.Time `json:"updatedAt"`
			}{
				{
					ID:        6,
					Name:      "JSX and Components",
					Order:     1,
					Completed: true,
					CreatedAt: now.Add(-40 * 24 * time.Hour),
					UpdatedAt: now.Add(-35 * 24 * time.Hour),
				},
				{
					ID:        7,
					Name:      "State and Props",
					Order:     2,
					Completed: true,
					CreatedAt: now.Add(-40 * 24 * time.Hour),
					UpdatedAt: now.Add(-30 * 24 * time.Hour),
				},
				{
					ID:        8,
					Name:      "Lifecycle Methods",
					Order:     3,
					Completed: false,
					CreatedAt: now.Add(-40 * 24 * time.Hour),
					UpdatedAt: now.Add(-40 * 24 * time.Hour),
				},
				{
					ID:        9,
					Name:      "Hooks",
					Order:     4,
					Completed: false,
					CreatedAt: now.Add(-40 * 24 * time.Hour),
					UpdatedAt: now.Add(-40 * 24 * time.Hour),
				},
			},
		},
	}
	
	c.JSON(http.StatusOK, response)
} 