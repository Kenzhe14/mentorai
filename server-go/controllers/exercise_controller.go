package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
)

// ExerciseController handles exercise generation requests
type ExerciseController struct {
	BaseController
}

// NewExerciseController creates a new exercise controller
func NewExerciseController(base BaseController) *ExerciseController {
	return &ExerciseController{BaseController: base}
}

// ExerciseRequest represents the request for generating exercises
type ExerciseRequest struct {
	Topic       string `json:"topic" binding:"required"`
	Difficulty  string `json:"difficulty,omitempty"`
	ExerciseNum int    `json:"exerciseNum,omitempty"`
}

// Exercise represents a single exercise
type Exercise struct {
	Type          string   `json:"type"`
	Question      string   `json:"question,omitempty"`
	Options       []string `json:"options,omitempty"`
	Prompt        string   `json:"prompt,omitempty"`
	StarterCode   string   `json:"starterCode,omitempty"`
	Solution      string   `json:"solution,omitempty"`
	CorrectAnswer int      `json:"correctAnswer,omitempty"`
	Answer        string   `json:"answer,omitempty"`
	Difficulty    string   `json:"difficulty,omitempty"`
	Explanation   string   `json:"explanation,omitempty"`
	Hints         []string `json:"hints,omitempty"`
}

// GenerateExercises generates exercises based on a topic
func (ec *ExerciseController) GenerateExercises(c *gin.Context) {
	var request struct {
		Topic       string `json:"topic" binding:"required"`
		Difficulty  string `json:"difficulty,omitempty"`
		QuizCount   int    `json:"quizCount,omitempty"`
		CodingCount int    `json:"codingCount,omitempty"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log the request details
	fmt.Printf("Generating exercises for topic: %s (quiz: %d, coding: %d, difficulty: %s)\n",
		request.Topic, request.QuizCount, request.CodingCount, request.Difficulty)

	// Set defaults if not provided
	if request.Difficulty == "" {
		request.Difficulty = "intermediate"
	}

	// Set default counts
	if request.QuizCount <= 0 {
		request.QuizCount = 3
	}
	if request.CodingCount <= 0 {
		request.CodingCount = 2
	}

	// Cap exercise counts to prevent excessively large requests
	if request.QuizCount > 5 {
		request.QuizCount = 5
	}
	if request.CodingCount > 5 {
		request.CodingCount = 5
	}

	// Generate both quiz and coding exercises
	quizExercises, err1 := ec.generateQuizExercises(request.Topic, request.Difficulty, request.QuizCount)
	if err1 != nil {
		fmt.Printf("Error generating quiz exercises: %v\n", err1)
		// Use fallbacks for quiz exercises
		quizExercises = ec.createEmergencyQuizExercises(request.Topic, request.Difficulty, request.QuizCount)
	} else {
		fmt.Printf("Successfully generated %d quiz exercises\n", len(quizExercises))
	}

	codingExercises, err2 := ec.generateCodingExercises(request.Topic, request.Difficulty, request.CodingCount)
	if err2 != nil {
		fmt.Printf("Error generating coding exercises: %v\n", err2)
		// Use fallbacks for coding exercises
		codingExercises = ec.createEmergencyCodingExercises(request.Topic, request.Difficulty, request.CodingCount)
	} else {
		fmt.Printf("Successfully generated %d coding exercises\n", len(codingExercises))
	}

	// Combine all exercises
	allExercises := append(quizExercises, codingExercises...)

	// Even if there are exercises, validate and ensure we have at least the minimum number required
	if len(quizExercises) < request.QuizCount {
		// Add emergency quiz exercises to make up the difference
		additionalQuizzes := ec.createEmergencyQuizExercises(request.Topic, request.Difficulty, request.QuizCount-len(quizExercises))
		allExercises = append(allExercises, additionalQuizzes...)
		fmt.Printf("Added %d emergency quiz exercises to meet minimum count\n", len(additionalQuizzes))
	}

	if len(codingExercises) < request.CodingCount {
		// Add emergency coding exercises to make up the difference
		additionalCoding := ec.createEmergencyCodingExercises(request.Topic, request.Difficulty, request.CodingCount-len(codingExercises))
		allExercises = append(allExercises, additionalCoding...)
		fmt.Printf("Added %d emergency coding exercises to meet minimum count\n", len(additionalCoding))
	}

	// Validate all exercises have the necessary fields for the frontend
	for i := range allExercises {
		// For quiz exercises, ensure they have correct fields
		if allExercises[i].Type == "quiz" {
			// Ensure we have at least 4 options
			for len(allExercises[i].Options) < 4 {
				allExercises[i].Options = append(allExercises[i].Options, fmt.Sprintf("Option %d", len(allExercises[i].Options)+1))
			}

			// Ensure correct answer is valid
			if allExercises[i].CorrectAnswer < 0 || allExercises[i].CorrectAnswer >= len(allExercises[i].Options) {
				allExercises[i].CorrectAnswer = 0
			}

			// Ensure explanation exists
			if allExercises[i].Explanation == "" {
				allExercises[i].Explanation = fmt.Sprintf("This question tests your understanding of key concepts in %s.", request.Topic)
			}

			// Ensure question exists
			if allExercises[i].Question == "" {
				allExercises[i].Question = fmt.Sprintf("What is an important concept in %s?", request.Topic)
			}
		}

		// For coding exercises, ensure they have correct fields
		if allExercises[i].Type == "coding" {
			// Ensure prompt exists
			if allExercises[i].Prompt == "" {
				allExercises[i].Prompt = fmt.Sprintf("Write a function that demonstrates a key concept of %s", request.Topic)
			}

			// Ensure starter code exists
			if allExercises[i].StarterCode == "" {
				allExercises[i].StarterCode = fmt.Sprintf("// Write your %s solution here\nfunction solution() {\n  // Your code here\n}", request.Topic)
			}

			// Ensure solution exists
			if allExercises[i].Solution == "" {
				allExercises[i].Solution = fmt.Sprintf("// Example solution\nfunction solution() {\n  // Implementation for %s\n  return 'Solution completed';\n}", request.Topic)
			}

			// Ensure hints exist
			if len(allExercises[i].Hints) == 0 {
				allExercises[i].Hints = []string{
					fmt.Sprintf("Think about the core principles of %s", request.Topic),
					"Break down the problem into smaller steps",
					"Consider edge cases in your solution",
				}
			}
		}

		// Ensure difficulty is set
		if allExercises[i].Difficulty == "" {
			allExercises[i].Difficulty = request.Difficulty
		}
	}

	fmt.Printf("Returning %d exercises for %s\n", len(allExercises), request.Topic)
	c.JSON(http.StatusOK, gin.H{
		"exercises": allExercises,
		"topic":     request.Topic,
	})
}

// generateQuizExercises generates quiz-type exercises
func (ec *ExerciseController) generateQuizExercises(topic, difficulty string, count int) ([]Exercise, error) {
	// Create prompt for quiz generation
	prompt := fmt.Sprintf(`Generate %d multiple choice quiz questions about "%s" with difficulty level: %s.

For each quiz question:
1. Provide a clear, specific question about %s concepts
2. Include exactly 4 answer options that are distinct and reasonable
3. Mark the correct answer with a 0-based index (0-3)
4. Add a brief but informative explanation of why the answer is correct
5. Specify difficulty level (Basic, Intermediate, Advanced)

Format your response as a JSON array with the EXACT structure shown below:
[
  {
    "type": "quiz",
    "question": "What is the main purpose of containerization in Docker?",
    "options": [
      "To create virtual machines",
      "To isolate applications and their dependencies",
      "To replace operating systems",
      "To minimize hardware requirements"
    ],
    "correctAnswer": 1,
    "explanation": "Docker containers provide isolation for applications and their dependencies, making them portable across different environments.",
    "difficulty": "Basic"
  }
]

IMPORTANT: 
- Each "correctAnswer" MUST be a number from 0-3, not a string
- The JSON structure must be exactly as shown
- Each question must have all fields specified
- Ensure "type" is always "quiz"
- Make sure the questions are educational and test real understanding`, count, topic, difficulty, topic)

	// Call OpenAI API
	response, err := ec.CallOpenAI(prompt)
	if err != nil {
		// Fallback to simple exercise generation if the full format fails
		return ec.fallbackToSimpleQuizzes(topic, difficulty, count)
	}

	// Try to parse response
	cleanedJSON := CleanupJSONResponse(response)
	if !strings.HasPrefix(cleanedJSON, "[") {
		cleanedJSON = ExtractJSON(cleanedJSON)
	}

	if cleanedJSON == "" {
		return ec.fallbackToSimpleQuizzes(topic, difficulty, count)
	}

	var quizzes []Exercise
	if err := json.Unmarshal([]byte(cleanedJSON), &quizzes); err != nil {
		return ec.fallbackToSimpleQuizzes(topic, difficulty, count)
	}

	// Validate and fix exercises
	for i := range quizzes {
		quizzes[i].Type = "quiz" // Ensure type is set

		// Ensure options exist
		if len(quizzes[i].Options) == 0 {
			quizzes[i].Options = []string{
				"Option A",
				"Option B",
				"Option C",
				"Option D",
			}
		}

		// Ensure correctAnswer is valid
		if quizzes[i].CorrectAnswer < 0 || quizzes[i].CorrectAnswer >= len(quizzes[i].Options) {
			quizzes[i].CorrectAnswer = 0
		}

		// Set difficulty if missing
		if quizzes[i].Difficulty == "" {
			quizzes[i].Difficulty = difficulty
		}
	}

	if len(quizzes) == 0 {
		return ec.fallbackToSimpleQuizzes(topic, difficulty, count)
	}

	return quizzes, nil
}

// generateCodingExercises generates coding-type exercises
func (ec *ExerciseController) generateCodingExercises(topic, difficulty string, count int) ([]Exercise, error) {
	// Create prompt for coding exercises
	prompt := fmt.Sprintf(`Generate %d coding exercises about "%s" with difficulty level: %s.

For each coding exercise:
1. Provide a clear, specific prompt describing what the code should accomplish
2. Include JavaScript starter code with helpful comments and function signature
3. Include a complete working solution that follows best practices
4. Add 2-3 helpful hints that guide without giving away the solution
5. Specify difficulty level (Basic, Intermediate, Advanced)

Format your response as a JSON array with the EXACT structure shown below:
[
  {
    "type": "coding",
    "prompt": "Write a function that deploys a Docker container with the specified image and port mapping.",
    "starterCode": "function deployContainer(imageName, hostPort, containerPort) {\n  // Your code here\n  // Should return a command string to run the container\n}",
    "solution": "function deployContainer(imageName, hostPort, containerPort) {\n  // Format a docker run command with proper port mapping\n  return 'docker run -d -p ' + hostPort + ':' + containerPort + ' ' + imageName;\n}",
    "hints": ["Remember to use the -d flag to run the container in detached mode", "Port mapping is specified with the -p flag", "The format for port mapping is hostPort:containerPort"],
    "difficulty": "Intermediate"
  }
]

IMPORTANT:
- The JSON structure must be exactly as shown
- Each exercise must have all fields specified
- Ensure "type" is always "coding"
- Make sure starterCode has proper syntax and indentation
- Make sure solution is fully implemented, not just comments
- The exercises should be practical and educational`, count, topic, difficulty)

	// Call OpenAI API
	response, err := ec.CallOpenAI(prompt)
	if err != nil {
		// Fallback to simple coding exercises
		return ec.fallbackToSimpleCodingExercises(topic, difficulty, count)
	}

	// Try to parse response
	cleanedJSON := CleanupJSONResponse(response)
	if !strings.HasPrefix(cleanedJSON, "[") {
		cleanedJSON = ExtractJSON(cleanedJSON)
	}

	if cleanedJSON == "" {
		return ec.fallbackToSimpleCodingExercises(topic, difficulty, count)
	}

	var codingExercises []Exercise
	if err := json.Unmarshal([]byte(cleanedJSON), &codingExercises); err != nil {
		return ec.fallbackToSimpleCodingExercises(topic, difficulty, count)
	}

	// Validate exercises
	for i := range codingExercises {
		codingExercises[i].Type = "coding" // Ensure type is set

		// Ensure starter code exists
		if codingExercises[i].StarterCode == "" {
			codingExercises[i].StarterCode = "function solution() {\n  // Your code here\n}"
		}

		// Ensure solution exists
		if codingExercises[i].Solution == "" {
			codingExercises[i].Solution = "function solution() {\n  return 'Solution for " + topic + "';\n}"
		}

		// Ensure hints exist
		if len(codingExercises[i].Hints) == 0 {
			codingExercises[i].Hints = []string{
				"Break the problem down into smaller steps",
				"Think about edge cases",
			}
		}

		// Set difficulty if missing
		if codingExercises[i].Difficulty == "" {
			codingExercises[i].Difficulty = difficulty
		}
	}

	if len(codingExercises) == 0 {
		return ec.fallbackToSimpleCodingExercises(topic, difficulty, count)
	}

	return codingExercises, nil
}

// fallbackToSimpleQuizzes provides basic quiz exercises when generation fails
func (ec *ExerciseController) fallbackToSimpleQuizzes(topic, difficulty string, count int) ([]Exercise, error) {
	// Create simple quizzes based on the topic
	fmt.Printf("Using fallback quiz generation for topic '%s'\n", topic)

	quizzes := []Exercise{
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("What is the most important concept in %s?", topic),
			Options:       []string{"Principle A", "Principle B", "Principle C", "Principle D"},
			CorrectAnswer: 1,
			Explanation:   fmt.Sprintf("Principle B is fundamental to understanding %s.", topic),
			Difficulty:    difficulty,
		},
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("Which of the following best describes %s?", topic),
			Options:       []string{"Description A", "Description B", "Description C", "Description D"},
			CorrectAnswer: 2,
			Explanation:   fmt.Sprintf("Description C most accurately captures the essence of %s.", topic),
			Difficulty:    difficulty,
		},
	}

	// Return at most the requested count
	if len(quizzes) > count {
		return quizzes[:count], nil
	}
	return quizzes, nil
}

// fallbackToSimpleCodingExercises provides basic coding exercises when generation fails
func (ec *ExerciseController) fallbackToSimpleCodingExercises(topic, difficulty string, count int) ([]Exercise, error) {
	// Create simple coding exercises based on the topic
	fmt.Printf("Using fallback coding exercise generation for topic '%s'\n", topic)

	exercises := []Exercise{
		{
			Type:        "coding",
			Prompt:      fmt.Sprintf("Write a function that demonstrates a basic principle of %s", topic),
			StarterCode: "function demonstrate() {\n  // Your code here\n}",
			Solution:    "function demonstrate() {\n  return 'This is a demonstration of " + topic + "';\n}",
			Hints:       []string{"Start by understanding the core concepts", "Apply the principles you've learned"},
			Difficulty:  difficulty,
		},
	}

	// Return at most the requested count
	if len(exercises) > count {
		return exercises[:count], nil
	}
	return exercises, nil
}

// createEmergencyQuizExercises creates a set of basic quiz exercises when all else fails
func (ec *ExerciseController) createEmergencyQuizExercises(topic, difficulty string, count int) []Exercise {
	quizzes := []Exercise{
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("Which of the following is a core concept in %s?", topic),
			Options:       []string{"Fundamental principle", "Unrelated concept", "Tangential idea", "None of the above"},
			CorrectAnswer: 0,
			Explanation:   fmt.Sprintf("Understanding fundamental principles is crucial for mastering %s.", topic),
			Difficulty:    difficulty,
		},
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("What is the primary benefit of learning %s?", topic),
			Options:       []string{"Enhanced problem-solving", "Improved technical skills", "Better career opportunities", "All of the above"},
			CorrectAnswer: 3,
			Explanation:   fmt.Sprintf("%s provides multiple benefits, including problem-solving skills, technical knowledge, and career advancement.", topic),
			Difficulty:    difficulty,
		},
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("Which approach is best for learning %s?", topic),
			Options:       []string{"Theoretical study only", "Practical application only", "Balanced theory and practice", "Memorization"},
			CorrectAnswer: 2,
			Explanation:   fmt.Sprintf("A balanced approach of theory and practice is most effective for learning %s.", topic),
			Difficulty:    difficulty,
		},
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("How does %s relate to other fields?", topic),
			Options:       []string{"No relation", "Minor overlap", "Significant integration", "Complete replacement"},
			CorrectAnswer: 2,
			Explanation:   fmt.Sprintf("%s significantly integrates with and complements other related fields.", topic),
			Difficulty:    difficulty,
		},
		{
			Type:          "quiz",
			Question:      fmt.Sprintf("What is an advanced application of %s?", topic),
			Options:       []string{"Basic implementation", "Intermediate usage", "Advanced application", "Expert optimization"},
			CorrectAnswer: 3,
			Explanation:   fmt.Sprintf("Expert optimization represents the most advanced application of %s principles.", topic),
			Difficulty:    difficulty,
		},
	}

	// Return at most the requested count
	if len(quizzes) > count {
		return quizzes[:count]
	}
	return quizzes
}

// createEmergencyCodingExercises creates a set of basic coding exercises when all else fails
func (ec *ExerciseController) createEmergencyCodingExercises(topic, difficulty string, count int) []Exercise {
	// Convert first letter of string to uppercase
	toUpperFirstChar := func(s string) string {
		if len(s) == 0 {
			return ""
		}
		r := []rune(s)
		r[0] = unicode.ToUpper(r[0])
		return string(r)
	}

	// Create a camelCase function name from the topic
	camelCase := func(s string) string {
		// Replace spaces and special characters
		s = strings.ReplaceAll(s, " ", "")
		s = strings.ReplaceAll(s, "-", "")
		s = strings.ReplaceAll(s, "_", "")

		if len(s) == 0 {
			return "function"
		}

		return toUpperFirstChar(s)
	}

	topicFunc := camelCase(topic)
	lowerTopicFunc := strings.ToLower(topicFunc)

	exercises := []Exercise{
		{
			Type:        "coding",
			Prompt:      fmt.Sprintf("Write a function that demonstrates a basic principle of %s", topic),
			StarterCode: fmt.Sprintf("function demonstrate%s() {\n  // Your code here\n  // Return a string explaining a basic principle\n}", topicFunc),
			Solution:    fmt.Sprintf("function demonstrate%s() {\n  return 'This demonstrates a basic principle of %s: Always start with fundamentals.';\n}", topicFunc, topic),
			Hints: []string{
				fmt.Sprintf("Think about the most fundamental concept in %s", topic),
				"Keep your explanation clear and concise",
				"Focus on one principle rather than trying to cover everything",
			},
			Difficulty: difficulty,
		},
		{
			Type:        "coding",
			Prompt:      fmt.Sprintf("Implement a function that applies %s to solve a simple problem", topic),
			StarterCode: fmt.Sprintf("function apply%s(input) {\n  // Your code here\n  // Process the input using %s principles\n  // Return the result\n}", topicFunc, topic),
			Solution:    fmt.Sprintf("function apply%s(input) {\n  // This is a simplified example\n  const processed = 'Processed: ' + input;\n  return 'Applied %s principles to ' + input + ' and got: ' + processed;\n}", topicFunc, topic),
			Hints: []string{
				"Start by defining what your function should accomplish",
				"Think about how to process the input parameter",
				fmt.Sprintf("Apply the core concepts of %s to transform the input", topic),
			},
			Difficulty: difficulty,
		},
		{
			Type:        "coding",
			Prompt:      fmt.Sprintf("Create a utility function related to %s that could be reused across projects", topic),
			StarterCode: fmt.Sprintf("function %sUtility(config) {\n  // Your code here\n  // Create a reusable utility function\n  // config is an object with settings\n}", lowerTopicFunc),
			Solution:    fmt.Sprintf("function %sUtility(config) {\n  const defaults = { level: 'basic', timeout: 1000 };\n  const settings = { ...defaults, ...config };\n  \n  return {\n    apply: function(data) {\n      return 'Applied ' + settings.level + ' %s to data with ' + settings.timeout + 'ms timeout';\n    },\n    getInfo: function() {\n      return 'Utility for applying %s principles';\n    }\n  };\n}", lowerTopicFunc, topic, topic),
			Hints: []string{
				"Consider what configuration options would be useful",
				"Implement multiple methods for different functionalities",
				"Make your utility flexible enough to handle different scenarios",
			},
			Difficulty: difficulty,
		},
	}

	// Return at most the requested count
	if len(exercises) > count {
		return exercises[:count]
	}
	return exercises
}
