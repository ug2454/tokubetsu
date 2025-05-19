package handlers

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"
	"tokubetsu/internal/database"
	"tokubetsu/internal/models"
	"tokubetsu/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

// ScanResponse is a tailored response for individual scan items in a list.
// It includes ProjectName for convenience.
type ScanResponse struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	ProjectName string    `json:"project_name"`
	ScanType    string    `json:"scan_type"`
	Status      string    `json:"status"`
	Score       float64   `json:"score,omitempty"`
	IssuesCount int       `json:"issues_count"`
	Timestamp   time.Time `json:"timestamp"` // This will be Scan.CreatedAt
	Summary     string    `json:"summary,omitempty"`
}

// ListScans godoc
// @Summary List recent scans
// @Description Get a paginated list of recent scans across all projects for the authenticated user, or for a specific project if projectId is provided.
// @Tags scans
// @Produce json
// @Param projectId query string false "Optional: Filter by Project ID"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 10)"
// @Success 200 {array} ScanResponse
// @Failure 400 {object} gin.H "Invalid query parameters"
// @Failure 500 {object} gin.H "Internal server error"
// @Router /api/scans [get]
// @Security BearerAuth
func ListScans(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var scans []models.Scan
	query := database.DB.Model(&models.Scan{}).Joins("JOIN projects ON projects.id = scans.project_id AND projects.user_id = ?", userID.(uuid.UUID))

	projectIDStr := c.Query("projectId")
	if projectIDStr != "" {
		projectID, err := uuid.Parse(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID format"})
			return
		}
		query = query.Where("scans.project_id = ?", projectID)
	}

	if err := query.Order("scans.created_at DESC").Limit(limit).Offset(offset).Preload("Project").Preload("Issues").Find(&scans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch scans"})
		return
	}

	var responses []ScanResponse
	for _, scan := range scans {
		responses = append(responses, ScanResponse{
			ID:          scan.ID,
			ProjectID:   scan.ProjectID,
			ProjectName: scan.Project.Title, // Assuming Project is preloaded and Project.Title exists
			ScanType:    scan.ScanType,
			Status:      scan.Status,
			Score:       scan.Score,
			IssuesCount: len(scan.Issues), // Assuming Issues are preloaded
			Timestamp:   scan.CreatedAt,
			Summary:     scan.Summary,
		})
	}

	c.JSON(http.StatusOK, responses)
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
