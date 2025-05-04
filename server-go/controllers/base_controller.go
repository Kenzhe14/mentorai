package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

// BaseController provides common functionality for all controllers
type BaseController struct {
	DB *gorm.DB
}

// NewBaseController creates a new base controller
func NewBaseController(db *gorm.DB) *BaseController {
	return &BaseController{DB: db}
}

// OpenAIRequest represents a request to the OpenAI API
type OpenAIRequest struct {
	Model    string                 `json:"model"`
	Messages []OpenAIRequestMessage `json:"messages"`
}

// OpenAIRequestMessage represents a message in an OpenAI API request
type OpenAIRequestMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIResponse represents a response from the OpenAI API
type OpenAIResponse struct {
	Choices []OpenAIResponseChoice `json:"choices"`
}

// OpenAIResponseChoice represents a choice in an OpenAI API response
type OpenAIResponseChoice struct {
	Message OpenAIResponseMessage `json:"message"`
}

// OpenAIResponseMessage represents a message in an OpenAI API response
type OpenAIResponseMessage struct {
	Content string `json:"content"`
}

// CallOpenAI calls the OpenAI API with a prompt
func (bc *BaseController) CallOpenAI(prompt string) (string, error) {
	maxRetries := 3
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			fmt.Printf("Retry attempt %d after error: %v\n", attempt, lastErr)
			time.Sleep(time.Duration(attempt) * 2 * time.Second) // Exponential backoff
		}

		// Create request body
		reqBody := OpenAIRequest{
			Model: os.Getenv("MODEL"),
			Messages: []OpenAIRequestMessage{
				{
					Role:    "user",
					Content: prompt,
				},
			},
		}

		// Marshal request body to JSON
		reqJSON, err := json.Marshal(reqBody)
		if err != nil {
			fmt.Println("ERROR: Failed to marshal request body:", err)
			lastErr = err
			continue
		}

		// Create HTTP request
		apiURL := os.Getenv("API_URL")
		fmt.Println("INFO: Making API request to:", apiURL)
		fmt.Println("INFO: Using model:", os.Getenv("MODEL"))

		req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqJSON))
		if err != nil {
			fmt.Println("ERROR: Failed to create HTTP request:", err)
			lastErr = err
			continue
		}

		// Set headers
		apiKey := os.Getenv("OPENROUTER_API_KEY")
		if apiKey == "" {
			fmt.Println("ERROR: OPENROUTER_API_KEY is not set")
			return "", fmt.Errorf("OPENROUTER_API_KEY is not set")
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+apiKey)
		fmt.Println("INFO: Request headers set, sending request...")

		// Send request with timeout
		client := &http.Client{
			Timeout: 60 * time.Second, // Increase timeout from 30 to 60 seconds
		}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Println("ERROR: Failed to send HTTP request:", err)
			lastErr = err
			continue
		}

		// Use defer with named return to ensure we close the body even if we return early
		defer func() {
			if resp != nil && resp.Body != nil {
				resp.Body.Close()
			}
		}()

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Println("ERROR: Failed to read response body:", err)
			lastErr = err
			continue
		}

		// Check status code
		fmt.Printf("INFO: API response status: %d\n", resp.StatusCode)
		if resp.StatusCode != http.StatusOK {
			errMsg := fmt.Sprintf("API call failed with status code %d: %s", resp.StatusCode, string(body))
			fmt.Println("ERROR:", errMsg)
			lastErr = fmt.Errorf(errMsg)
			continue
		}

		// Parse response
		var openAIResp OpenAIResponse
		err = json.Unmarshal(body, &openAIResp)
		if err != nil {
			fmt.Println("ERROR: Failed to unmarshal response:", err)
			fmt.Println("Response body:", string(body))
			lastErr = err
			continue
		}

		// Check if response is valid
		if len(openAIResp.Choices) == 0 {
			errMsg := "No choices in response"
			fmt.Println("ERROR:", errMsg)
			fmt.Println("Response body:", string(body))
			lastErr = fmt.Errorf("no response from API")
			continue
		}

		fmt.Println("INFO: Successfully received API response")
		return openAIResp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("failed after %d attempts, last error: %v", maxRetries, lastErr)
}

// ExtractJSON extracts JSON from a string
func ExtractJSON(content string) string {
	// First look for JSON object
	objectStart := strings.Index(content, "{")
	objectEnd := strings.LastIndex(content, "}")

	// Look for JSON array
	arrayStart := strings.Index(content, "[")
	arrayEnd := strings.LastIndex(content, "]")

	// Determine if we're looking for an object or an array
	if objectStart != -1 && arrayStart != -1 {
		// Both exist, use the one that appears first
		if objectStart < arrayStart {
			if objectEnd != -1 && objectStart < objectEnd {
				return content[objectStart : objectEnd+1]
			}
		} else {
			if arrayEnd != -1 && arrayStart < arrayEnd {
				return content[arrayStart : arrayEnd+1]
			}
		}
	} else if objectStart != -1 && objectEnd != -1 && objectStart < objectEnd {
		return content[objectStart : objectEnd+1]
	} else if arrayStart != -1 && arrayEnd != -1 && arrayStart < arrayEnd {
		return content[arrayStart : arrayEnd+1]
	}

	// No valid JSON found
	return ""
}

// CleanupJSONResponse removes markdown code blocks and trims spaces from JSON response
func CleanupJSONResponse(content string) string {
	// Trim spaces
	content = strings.TrimSpace(content)

	// Sometimes the API returns markdown code blocks, so remove them if present
	if strings.Contains(content, "```") {
		// Handle JSON code blocks
		jsonBlockRegex := "(?s)```(?:json)?\\s*(\\{.*?\\}|\\[.*?\\])\\s*```"
		re, err := regexp.Compile(jsonBlockRegex)
		if err == nil {
			matches := re.FindStringSubmatch(content)
			if len(matches) > 1 {
				return strings.TrimSpace(matches[1])
			}
		}

		// Handle other code blocks by removing the markers
		content = strings.ReplaceAll(content, "```json", "")
		content = strings.ReplaceAll(content, "```", "")
	}

	// Try to extract JSON if we don't have a clean JSON object/array yet
	var testObj interface{}
	if err := json.Unmarshal([]byte(content), &testObj); err != nil {
		// Not valid JSON, try to extract it
		extracted := ExtractJSON(content)
		if extracted != "" {
			return extracted
		}
	}

	return strings.TrimSpace(content)
}
