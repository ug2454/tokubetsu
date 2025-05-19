package handlers

import (
	"net/http"
	"tokubetsu/internal/models"
	"tokubetsu/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ComplianceHandler struct {
	db      *gorm.DB
	service *services.ComplianceService
}

func NewComplianceHandler(db *gorm.DB, scanner *services.Scanner) *ComplianceHandler {
	return &ComplianceHandler{
		db:      db,
		service: services.NewComplianceService(scanner),
	}
}

// GenerateReport generates a compliance report for a project
func (h *ComplianceHandler) GenerateReport(c *gin.Context) {
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

	// Verify project ownership
	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	// Generate compliance report
	report, err := h.service.GenerateReport(projectID, project.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save report to database
	if err := h.db.Create(report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save report"})
		return
	}

	c.JSON(http.StatusOK, report)
}

// GetProjectReports retrieves all compliance reports for a project
func (h *ComplianceHandler) GetProjectReports(c *gin.Context) {
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

	// Verify project ownership
	var project models.Project
	if err := h.db.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
		return
	}

	// Get all reports for the project
	var reports []models.ComplianceReport
	if err := h.db.Where("project_id = ?", projectID).
		Order("generated_at DESC").
		Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch reports"})
		return
	}

	c.JSON(http.StatusOK, reports)
}

// GetReport retrieves a specific compliance report
func (h *ComplianceHandler) GetReport(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	reportID, err := uuid.Parse(c.Param("reportId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}

	// Get report with project ownership verification
	var report models.ComplianceReport
	if err := h.db.Joins("Project").
		Where("compliance_reports.id = ? AND Project.user_id = ?", reportID, userID).
		First(&report).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
		return
	}

	c.JSON(http.StatusOK, report)
}
