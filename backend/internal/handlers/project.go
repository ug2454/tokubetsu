package handlers

import (
	"net/http"
	"time"

	"tokubetsu/internal/models"

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

	// Update the last scan time
	project.LastScan = time.Now()
	if err := h.db.Save(&project).Error; err != nil {
		log.Printf("Failed to update project: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Successfully updated project scan time")

	// Record activity
	go func() {
		details := fmt.Sprintf("Scan initiated for project '%s'.", project.Title)
		err := RecordActivity(userID, "initiated_scan", "scan", &project.ID, details)
		if err != nil {
			log.Printf("Error recording activity for scan initiation: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "scan initiated",
		"score":   project.Score, // This score is likely the project's overall score, not this specific scan's score yet.
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
