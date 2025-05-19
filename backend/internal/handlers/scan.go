package handlers

import (
	"fmt"
	"log"
	"net/url"
	"tokubetsu/internal/services"

	"github.com/gin-gonic/gin"
)

type ScanHandler struct {
	scanner *services.Scanner
}

func NewScanHandler() *ScanHandler {
	return &ScanHandler{
		scanner: services.NewScanner(),
	}
}

// ScanHandler handles accessibility scanning of external URLs
func (h *ScanHandler) ScanHandler(c *gin.Context) {
	// Get URL from query parameter
	targetURL := c.Query("url")
	log.Printf("=== Scan Request Received ===")
	log.Printf("Raw URL from request: %s", targetURL)

	if targetURL == "" {
		log.Printf("Error: URL parameter is missing")
		c.JSON(400, gin.H{"error": "URL parameter is required"})
		return
	}

	// Parse and validate the URL
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		log.Printf("Error parsing URL: %v", err)
		c.JSON(400, gin.H{"error": fmt.Sprintf("Invalid URL format: %v", err)})
		return
	}

	// Ensure URL has proper scheme
	if parsedURL.Scheme == "" {
		parsedURL.Scheme = "https"
		log.Printf("Added https scheme to URL")
	}

	if parsedURL.Host == "" || parsedURL.Host == "test" {
		log.Printf("Error: Invalid host in URL: %s", parsedURL.Host)
		c.JSON(400, gin.H{"error": "Invalid URL: missing or invalid host"})
		return
	}

	// Use the properly parsed and validated URL
	targetURL = parsedURL.String()
	log.Printf("Final validated URL for scanning: %s", targetURL)

	// Run scan
	result, err := h.scanner.ScanURL(targetURL)
	if err != nil {
		log.Printf("Error running scan: %v", err)
		c.JSON(500, gin.H{
			"error": fmt.Sprintf("Failed to scan URL: %v", err),
		})
		return
	}

	// Calculate score (0-100)
	totalChecks := len(result.Passes) + len(result.Violations)
	var score int
	if totalChecks > 0 {
		score = (len(result.Passes) * 100) / totalChecks
	}

	log.Printf("=== Scan Results ===")
	log.Printf("Number of passes: %d", len(result.Passes))
	log.Printf("Number of violations: %d", len(result.Violations))
	log.Printf("Score: %d", score)

	response := gin.H{
		"violations": result.Violations,
		"passes":     len(result.Passes),
		"score":      score,
	}

	// Debug log the violations data
	for i, v := range result.Violations {
		log.Printf("Violation #%d: %s (Impact: %s)", i+1, v.Description, v.Impact)
		log.Printf("  Help: %s", v.Help)
		if len(v.Nodes) > 0 {
			log.Printf("  First node length: %d characters", len(v.Nodes[0]))
			if len(v.Nodes[0]) > 100 {
				log.Printf("  First node preview: %s...", v.Nodes[0][:100])
			} else {
				log.Printf("  First node: %s", v.Nodes[0])
			}
		} else {
			log.Printf("  No nodes data")
		}
	}

	c.JSON(200, response)
}

func CreateScan(c *gin.Context) {
	c.JSON(501, gin.H{
		"message": "Scan creation not implemented yet",
	})
}

func ListScans(c *gin.Context) {
	c.JSON(501, gin.H{
		"message": "Scan listing not implemented yet",
	})
}

func GetScan(c *gin.Context) {
	c.JSON(501, gin.H{
		"message": "Get scan not implemented yet",
	})
}

func DeleteScan(c *gin.Context) {
	c.JSON(501, gin.H{
		"message": "Delete scan not implemented yet",
	})
}
