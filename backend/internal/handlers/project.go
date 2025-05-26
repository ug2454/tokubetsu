package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"tokubetsu/internal/models"
	"tokubetsu/internal/services"

	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectHandler struct {
	db *gorm.DB
}

type CreateProjectInput struct {
	Title       string `json:"title" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

func NewProjectHandler(db *gorm.DB) *ProjectHandler {
	return &ProjectHandler{db: db}
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var input CreateProjectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	project := models.Project{
		Title:       input.Title,
		Name:        input.Name,
		Description: input.Description,
		URL:         input.URL,
		UserID:      userID,
		Status:      "active",
	}

	if err := h.db.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Record activity
	go func() {
		err := RecordActivity(userID, "created_project", "project", &project.ID, "Project '"+project.Title+"' created")
		if err != nil {
			log.Printf("Error recording activity for project creation: %v", err)
			// Depending on requirements, you might want to handle this error more robustly
		}
	}()

	c.JSON(http.StatusCreated, project)
}

// GetProjects retrieves all projects for the current user
func (h *ProjectHandler) GetProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var projects []models.Project
	if err := h.db.Where("user_id = ?", userID).Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// GetProject retrieves a specific project
func (h *ProjectHandler) GetProject(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	projectID, err := uuid.Parse(c.Param("projectId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID"})
		return
	}

	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	c.JSON(http.StatusOK, project)
}

// UpdateProject updates a project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	projectID, err := uuid.Parse(c.Param("projectId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID"})
		return
	}

	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	// Store the original title for the activity log, in case it's changed.
	originalTitle := project.Title

	if err := c.ShouldBindJSON(&project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure the user ID doesn't change and the project ID from the URL is used.
	project.UserID = userID
	project.ID = projectID

	if err := h.db.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Record activity
	go func() {
		details := fmt.Sprintf("Project '%s' updated.", originalTitle)
		if originalTitle != project.Title {
			details = fmt.Sprintf("Project '%s' (now '%s') updated.", originalTitle, project.Title)
		}
		err := RecordActivity(userID, "updated_project", "project", &project.ID, details)
		if err != nil {
			log.Printf("Error recording activity for project update: %v", err)
		}
	}()

	c.JSON(http.StatusOK, project)
}

// DeleteProject deletes a project
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	projectID, err := uuid.Parse(c.Param("projectId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID"})
		return
	}

	// Fetch project details before deleting for activity logging
	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		// If project not found, it might have been already deleted or never existed.
		// We can choose to log this as an attempt or just return error.
		// For now, we return error as before.
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}
	projectTitle := project.Title // Store title for logging

	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).Delete(&models.Project{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Record activity
	go func() {
		details := fmt.Sprintf("Project '%s' deleted.", projectTitle)
		err := RecordActivity(userID, "deleted_project", "project", &projectID, details)
		if err != nil {
			log.Printf("Error recording activity for project deletion: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "project deleted"})
}

// RunScan initiates an accessibility scan for a project
func (h *ProjectHandler) RunScan(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)

	rawProjectID := c.Param("projectId")
	log.Printf("Raw project ID from URL parameter: %s", rawProjectID)

	projectID, err := uuid.Parse(rawProjectID)
	if err != nil {
		log.Printf("Failed to parse project ID as UUID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID"})
		return
	}

	log.Printf("Running scan for project ID: %s", projectID)

	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		log.Printf("Project not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	log.Printf("Found project: %+v", project)

	// Validate project URL
	if project.URL == "" {
		log.Printf("Error: Project has no URL to scan")
		c.JSON(http.StatusBadRequest, gin.H{"error": "project URL is required for scanning"})
		return
	}

	// Create initial scan record with "pending" status
	scan := models.Scan{
		ProjectID: projectID,
		ScanType:  "accessibility",
		Status:    "pending",
	}

	if err := h.db.Create(&scan).Error; err != nil {
		log.Printf("Failed to create scan record: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create scan record"})
		return
	}

	log.Printf("Created scan record with ID: %s", scan.ID)

	// Update the last scan time
	project.LastScan = time.Now()
	if err := h.db.Save(&project).Error; err != nil {
		log.Printf("Failed to update project: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Successfully updated project scan time")

	// Record activity for scan initiation
	go func() {
		details := fmt.Sprintf("Scan initiated for project '%s'.", project.Title)
		err := RecordActivity(userID, "initiated_scan", "scan", &project.ID, details)
		if err != nil {
			log.Printf("Error recording activity for scan initiation: %v", err)
		}
	}()

	// Perform the actual scan in a separate goroutine
	go func() {
		log.Printf("Starting accessibility scan for URL: %s", project.URL)

		// Update scan status to "in_progress"
		scan.Status = "in_progress"
		if err := h.db.Save(&scan).Error; err != nil {
			log.Printf("Failed to update scan status to in_progress: %v", err)
			return
		}

		// Create scanner instance
		scanner := services.NewScanner()

		// Perform the scan
		result, err := scanner.ScanURL(project.URL)
		if err != nil {
			log.Printf("Error performing scan: %v", err)

			// Update scan status to "failed"
			scan.Status = "failed"
			scan.Summary = fmt.Sprintf("Scan failed: %v", err)
			if err := h.db.Save(&scan).Error; err != nil {
				log.Printf("Failed to update scan status to failed: %v", err)
			}

			// Record activity for scan failure
			details := fmt.Sprintf("Scan failed for project '%s': %v", project.Title, err)
			err = RecordActivity(userID, "scan_failed", "scan", &project.ID, details)
			if err != nil {
				log.Printf("Error recording activity for scan failure: %v", err)
			}
			return
		}

		// Calculate score
		totalChecks := len(result.Passes) + len(result.Violations)
		var score float64
		if totalChecks > 0 {
			score = float64(len(result.Passes)) / float64(totalChecks) * 100
		}

		log.Printf("Scan completed with score: %.2f", score)

		// Update scan with results
		scan.Status = "completed"
		scan.Score = score
		scan.Summary = fmt.Sprintf("Found %d violations and %d passes", len(result.Violations), len(result.Passes))

		// Store result as JSON
		resultJSON, err := json.Marshal(result)
		if err != nil {
			log.Printf("Failed to marshal scan result to JSON: %v", err)
			return
		}
		resultJSONStr := string(resultJSON)
		scan.ResultJSON = &resultJSONStr

		if err := h.db.Save(&scan).Error; err != nil {
			log.Printf("Failed to update scan with results: %v", err)
			return
		}

		// Create accessibility issues from violations
		for _, violation := range result.Violations {
			// Determine severity based on impact
			severity := "medium"
			switch violation.Impact {
			case "critical":
				severity = "critical"
			case "serious":
				severity = "high"
			case "moderate":
				severity = "medium"
			case "minor":
				severity = "low"
			}

			// Get first node if available
			htmlSnippet := "No element specified"
			if len(violation.Nodes) > 0 {
				htmlSnippet = violation.Nodes[0]
			}

			issue := models.AccessibilityIssue{
				ScanID:        scan.ID,
				Severity:      severity,
				Description:   violation.Description,
				HTMLSnippet:   htmlSnippet,
				FixSuggestion: violation.Help,
			}

			if err := h.db.Create(&issue).Error; err != nil {
				log.Printf("Failed to create accessibility issue: %v", err)
			}
		}

		// Update project score with the latest scan score
		project.Score = score
		if err := h.db.Save(&project).Error; err != nil {
			log.Printf("Failed to update project score: %v", err)
		}

		// Record activity for scan completion
		details := fmt.Sprintf("Scan completed for project '%s' with score %.2f%%", project.Title, score)
		err = RecordActivity(userID, "scan_completed", "scan", &project.ID, details)
		if err != nil {
			log.Printf("Error recording activity for scan completion: %v", err)
		}

		log.Printf("Scan process completed successfully")
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "scan initiated",
		"scan_id": scan.ID,
		"status":  scan.Status,
	})
}

// ListProjects returns all projects for the authenticated user
func (h *ProjectHandler) ListProjects(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var projects []models.Project
	if err := h.db.Where("user_id = ?", userID).Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}
