package handlers

import (
	"net/http"
	"strconv"

	"tokubetsu/internal/database"
	"tokubetsu/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListActivityLogs godoc
// @Summary List recent activity logs
// @Description Get a paginated list of recent activity logs for the authenticated user.
// @Tags activity
// @Produce json
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 10)"
// @Param type query string false "Filter by activity type (e.g., project, scan, user)"
// @Param projectId query string false "Filter by project ID"
// @Success 200 {array} models.ActivityLogResponse
// @Failure 400 {object} gin.H "Invalid query parameters"
// @Failure 500 {object} gin.H "Internal server error"
// @Router /api/activity [get]
// @Security BearerAuth
func ListActivityLogs(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var activities []models.ActivityLog
	query := database.DB.Model(&models.ActivityLog{}).Where("user_id = ?", userID.(uuid.UUID))

	activityType := c.Query("type")
	if activityType != "" {
		query = query.Where("type = ?", activityType)
	}

	projectIDStr := c.Query("projectId")
	if projectIDStr != "" {
		projectID, err := uuid.Parse(projectIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project ID format"})
			return
		}
		query = query.Where("project_id = ?", projectID)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Preload("Project").Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch activity logs"})
		return
	}

	var responses []models.ActivityLogResponse
	for _, activity := range activities {
		resp := models.ActivityLogResponse{
			ID:        activity.ID,
			UserID:    activity.UserID,
			Action:    activity.Action,
			Timestamp: activity.CreatedAt, // Using Base.CreatedAt
			ProjectID: activity.ProjectID,
			Details:   activity.Details,
			Type:      activity.Type,
		}
		if activity.ProjectID != nil && activity.Project != nil {
			resp.ProjectName = &activity.Project.Title // Assuming Project is preloaded
		}
		responses = append(responses, resp)
	}

	c.JSON(http.StatusOK, responses)
}

// Helper function to record an activity
// This should be called from other parts of the application where activities occur.
func RecordActivity(userID uuid.UUID, action string, activityType string, projectID *uuid.UUID, details string) error {
	activity := models.ActivityLog{
		UserID:    userID,
		Action:    action,
		Type:      activityType,
		ProjectID: projectID,
		Details:   details,
		// Timestamp (CreatedAt) will be set by GORM
	}

	if err := database.DB.Create(&activity).Error; err != nil {
		// Log the error, but don't necessarily block the main operation
		// e.g., log.Printf("Error recording activity: %v", err)
		return err
	}
	return nil
}
