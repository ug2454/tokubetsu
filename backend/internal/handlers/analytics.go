package handlers

import (
	"net/http"
	"time"
	"tokubetsu/internal/database"
	"tokubetsu/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyticsHandler struct{}

func NewAnalyticsHandler() *AnalyticsHandler {
	return &AnalyticsHandler{}
}

type ProjectStatusAnalytics struct {
	Active   int `json:"active"`
	Inactive int `json:"inactive"`
}

type ScanHistoryPoint struct {
	Date   string `json:"date"`
	Scans  int    `json:"scans"`
	Issues int    `json:"issues"`
}

type IssueTypeAnalytics struct {
	Critical int `json:"critical"`
	High     int `json:"high"`
	Medium   int `json:"medium"`
	Low      int `json:"low"`
}

type AnalyticsResponse struct {
	ProjectStatus ProjectStatusAnalytics `json:"project_status"`
	ScanHistory   []ScanHistoryPoint     `json:"scan_history"`
	IssueTypes    IssueTypeAnalytics     `json:"issue_types"`
	TotalScans    int                    `json:"total_scans"`
	TotalIssues   int                    `json:"total_issues"`
}

// GetAnalytics provides comprehensive analytics data for the dashboard
func (h *AnalyticsHandler) GetAnalytics(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userUUID := userID.(uuid.UUID)

	// Get project status analytics
	var projectStatus ProjectStatusAnalytics
	var activeCount, inactiveCount int64

	database.DB.Model(&models.Project{}).
		Where("user_id = ? AND status = ?", userUUID, "active").
		Count(&activeCount)

	database.DB.Model(&models.Project{}).
		Where("user_id = ? AND status != ?", userUUID, "active").
		Count(&inactiveCount)

	projectStatus.Active = int(activeCount)
	projectStatus.Inactive = int(inactiveCount)

	// Get scan history for last 7 days
	var scanHistory []ScanHistoryPoint
	for i := 6; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)

		var scansCount int64
		var issuesCount int64

		// Count scans for this day
		database.DB.Model(&models.Scan{}).
			Joins("JOIN projects ON projects.id = scans.project_id").
			Where("projects.user_id = ? AND scans.created_at >= ? AND scans.created_at < ?", userUUID, startOfDay, endOfDay).
			Count(&scansCount)

		// Count issues for this day
		database.DB.Model(&models.AccessibilityIssue{}).
			Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
			Joins("JOIN projects ON projects.id = scans.project_id").
			Where("projects.user_id = ? AND accessibility_issues.created_at >= ? AND accessibility_issues.created_at < ?", userUUID, startOfDay, endOfDay).
			Count(&issuesCount)

		var dateLabel string
		if i == 0 {
			dateLabel = "Today"
		} else if i == 1 {
			dateLabel = "Yesterday"
		} else {
			dateLabel = date.Format("Jan 2")
		}

		scanHistory = append(scanHistory, ScanHistoryPoint{
			Date:   dateLabel,
			Scans:  int(scansCount),
			Issues: int(issuesCount),
		})
	}

	// Get issue type breakdown
	var issueTypes IssueTypeAnalytics
	var criticalCount, highCount, mediumCount, lowCount int64

	database.DB.Model(&models.AccessibilityIssue{}).
		Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ? AND accessibility_issues.severity = ?", userUUID, "critical").
		Count(&criticalCount)

	database.DB.Model(&models.AccessibilityIssue{}).
		Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ? AND accessibility_issues.severity = ?", userUUID, "high").
		Count(&highCount)

	database.DB.Model(&models.AccessibilityIssue{}).
		Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ? AND accessibility_issues.severity = ?", userUUID, "medium").
		Count(&mediumCount)

	database.DB.Model(&models.AccessibilityIssue{}).
		Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ? AND accessibility_issues.severity = ?", userUUID, "low").
		Count(&lowCount)

	issueTypes.Critical = int(criticalCount)
	issueTypes.High = int(highCount)
	issueTypes.Medium = int(mediumCount)
	issueTypes.Low = int(lowCount)

	// Get total counts
	var totalScans int64
	var totalIssues int64

	database.DB.Model(&models.Scan{}).
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ?", userUUID).
		Count(&totalScans)

	database.DB.Model(&models.AccessibilityIssue{}).
		Joins("JOIN scans ON scans.id = accessibility_issues.scan_id").
		Joins("JOIN projects ON projects.id = scans.project_id").
		Where("projects.user_id = ?", userUUID).
		Count(&totalIssues)

	response := AnalyticsResponse{
		ProjectStatus: projectStatus,
		ScanHistory:   scanHistory,
		IssueTypes:    issueTypes,
		TotalScans:    int(totalScans),
		TotalIssues:   int(totalIssues),
	}

	c.JSON(http.StatusOK, response)
}
