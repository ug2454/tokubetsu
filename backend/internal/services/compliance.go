package services

import (
	"fmt"
	"time"
	"tokubetsu/internal/models"

	"github.com/google/uuid"
)

// ComplianceService handles WCAG compliance checking and reporting
type ComplianceService struct {
	scanner *Scanner
}

// NewComplianceService creates a new instance of ComplianceService
func NewComplianceService(scanner *Scanner) *ComplianceService {
	return &ComplianceService{
		scanner: scanner,
	}
}

// GenerateReport creates a detailed compliance report for a given URL
func (s *ComplianceService) GenerateReport(projectID uuid.UUID, url string) (*models.ComplianceReport, error) {
	// Run accessibility scan
	scanResult, err := s.scanner.ScanURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to scan URL: %v", err)
	}

	fmt.Printf("Scan found %d violations\n", len(scanResult.Violations))
	for _, v := range scanResult.Violations {
		fmt.Printf("Violation: %s, Impact: %s, Description: %s\n", v.ID, v.Impact, v.Description)
	}

	fmt.Printf("Scan found %d passes\n", len(scanResult.Passes))
	for _, p := range scanResult.Passes {
		fmt.Printf("Pass: %s, Description: %s\n", p.ID, p.Description)
	}

	// Initialize report with default values
	report := &models.ComplianceReport{
		ProjectID:           projectID,
		URL:                 url,
		GeneratedAt:         time.Now(),
		OverallScore:        0,
		LevelAScore:         0,
		LevelAAScore:        0,
		LevelAAAScore:       0,
		PerceivableScore:    100.0,
		OperableScore:       100.0,
		UnderstandableScore: 100.0,
		RobustScore:         100.0,
	}

	// Count passes for each level/principle
	var (
		levelAPasses, levelAAPasses, levelAAAPasses                           int
		perceivablePasses, operablePasses, understandablePasses, robustPasses int
	)
	for _, pass := range scanResult.Passes {
		if isLevelARule(pass.ID) {
			levelAPasses++
		}
		if isLevelAARule(pass.ID) {
			levelAAPasses++
		}
		if isLevelAAARule(pass.ID) {
			levelAAAPasses++
		}
		if isPerceivableRule(pass.ID) {
			perceivablePasses++
		}
		if isOperableRule(pass.ID) {
			operablePasses++
		}
		if isUnderstandableRule(pass.ID) {
			understandablePasses++
		}
		if isRobustRule(pass.ID) {
			robustPasses++
		}
	}

	// Process violations and categorize them
	var (
		levelAViolations, levelAAViolations, levelAAAViolations                               int
		perceivableViolations, operableViolations, understandableViolations, robustViolations int
	)
	for _, violation := range scanResult.Violations {
		compViolation := models.ComplianceViolation{
			ReportID:    report.ID,
			RuleID:      violation.ID,
			Impact:      violation.Impact,
			Description: violation.Description,
			Element:     violation.Nodes[0],
			Suggestion:  violation.Help,
		}
		switch {
		case isLevelARule(violation.ID):
			levelAViolations++
			compViolation.WCAGLevel = "A"
		case isLevelAARule(violation.ID):
			levelAAViolations++
			compViolation.WCAGLevel = "AA"
		case isLevelAAARule(violation.ID):
			levelAAAViolations++
			compViolation.WCAGLevel = "AAA"
		}
		switch {
		case isPerceivableRule(violation.ID):
			perceivableViolations++
		case isOperableRule(violation.ID):
			operableViolations++
		case isUnderstandableRule(violation.ID):
			understandableViolations++
		case isRobustRule(violation.ID):
			robustViolations++
		}
		report.Violations = append(report.Violations, compViolation)
	}

	// Calculate level scores
	if levelAPasses+levelAViolations > 0 {
		report.LevelAScore = float64(levelAPasses) / float64(levelAPasses+levelAViolations) * 100
	}
	if levelAAPasses+levelAAViolations > 0 {
		report.LevelAAScore = float64(levelAAPasses) / float64(levelAAPasses+levelAAViolations) * 100
	}
	if levelAAAPasses+levelAAAViolations > 0 {
		report.LevelAAAScore = float64(levelAAAPasses) / float64(levelAAAPasses+levelAAAViolations) * 100
	}

	// Calculate category scores
	if perceivablePasses+perceivableViolations > 0 {
		report.PerceivableScore = float64(perceivablePasses) / float64(perceivablePasses+perceivableViolations) * 100
	}
	if operablePasses+operableViolations > 0 {
		report.OperableScore = float64(operablePasses) / float64(operablePasses+operableViolations) * 100
	}
	if understandablePasses+understandableViolations > 0 {
		report.UnderstandableScore = float64(understandablePasses) / float64(understandablePasses+understandableViolations) * 100
	}
	if robustPasses+robustViolations > 0 {
		report.RobustScore = float64(robustPasses) / float64(robustPasses+robustViolations) * 100
	}

	// Calculate Overall Score as an average of the four principle scores
	report.OverallScore = (report.PerceivableScore + report.OperableScore + report.UnderstandableScore + report.RobustScore) / 4.0
	// Ensure OverallScore is not NaN if all principle scores are 0 (e.g. no relevant rules triggered)
	if report.PerceivableScore == 0 && report.OperableScore == 0 && report.UnderstandableScore == 0 && report.RobustScore == 0 {
		report.OverallScore = 0 // Or handle as appropriate, e.g. if no rules, score is 100 or N/A
	}

	return report, nil
}

// Helper functions to categorize rules
func isLevelARule(ruleID string) bool {
	levelARules := map[string]bool{
		"image-alt":   true,
		"button-name": true,
		"label":       true,
		"link-name":   true,
	}
	return levelARules[ruleID]
}

func isLevelAARule(ruleID string) bool {
	levelAARules := map[string]bool{
		"color-contrast":                      true,
		"frame-title":                         true,
		"landmark-complementary-is-top-level": true,
	}
	return levelAARules[ruleID]
}

func isLevelAAARule(ruleID string) bool {
	levelAAARules := map[string]bool{
		"target-size":       true,
		"timing-adjustable": true,
	}
	return levelAAARules[ruleID]
}

func isPerceivableRule(ruleID string) bool {
	perceivableRules := map[string]bool{
		"image-alt":      true,
		"color-contrast": true,
		"video-caption":  true,
	}
	return perceivableRules[ruleID]
}

func isOperableRule(ruleID string) bool {
	operableRules := map[string]bool{
		"button-name": true,
		"link-name":   true,
		"target-size": true,
	}
	return operableRules[ruleID]
}

func isUnderstandableRule(ruleID string) bool {
	understandableRules := map[string]bool{
		"label":          true,
		"language-valid": true,
	}
	return understandableRules[ruleID]
}

func isRobustRule(ruleID string) bool {
	robustRules := map[string]bool{
		"aria-valid":    true,
		"html-has-lang": true,
	}
	return robustRules[ruleID]
}
