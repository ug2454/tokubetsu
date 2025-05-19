package handlers

import (
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ProxyHandler handles requests to proxy external URLs
func ProxyHandler(c *gin.Context) {
	// Get URL from query parameter
	targetURL := c.Query("url")
	if targetURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL parameter is required"})
		return
	}

	// Create a new request
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	// Add common headers to appear as a normal browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")

	// Make the request
	client := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return nil // Allow redirects
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URL"})
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response"})
		return
	}

	// Set CORS headers
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Origin, Content-Type")

	// Set content type to HTML and remove security headers
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.Header("X-Frame-Options", "ALLOWALL")
	c.Header("Content-Security-Policy", "")

	// Modify HTML content to handle frame-blocking
	htmlContent := string(body)
	htmlContent = strings.ReplaceAll(htmlContent, `<meta http-equiv="X-Frame-Options"`, `<meta http-equiv="X-Frame-Options-Disabled"`)

	// Write the modified response
	c.String(resp.StatusCode, htmlContent)
}
