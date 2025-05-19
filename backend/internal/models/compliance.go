package models

import (
	"time"

	"github.com/google/uuid"
)

// ComplianceReport represents a detailed accessibility compliance report
type ComplianceReport struct {
	Base
	ProjectID    uuid.UUID `json:"project_id" gorm:"type:uuid;not null"`
	URL          string    `json:"url" gorm:"not null"`
	GeneratedAt  time.Time `json:"generated_at" gorm:"not null"`
	OverallScore float64   `json:"overall_score" gorm:"not null"`

	// WCAG Level Scores
	LevelAScore   float64 `json:"level_a_score" gorm:"not null"`
	LevelAAScore  float64 `json:"level_aa_score" gorm:"not null"`
	LevelAAAScore float64 `json:"level_aaa_score" gorm:"not null"`

	// Category Scores
	PerceivableScore    float64 `json:"perceivable_score" gorm:"not null"`
	OperableScore       float64 `json:"operable_score" gorm:"not null"`
	UnderstandableScore float64 `json:"understandable_score" gorm:"not null"`
	RobustScore         float64 `json:"robust_score" gorm:"not null"`

	// Relationships
	Project    Project               `json:"-" gorm:"foreignKey:ProjectID"`
	Violations []ComplianceViolation `json:"violations" gorm:"foreignKey:ReportID"`
}

// ComplianceViolation represents a specific WCAG violation found during scanning
type ComplianceViolation struct {
	Base
	ReportID    uuid.UUID `json:"report_id" gorm:"type:uuid;not null"`
	RuleID      string    `json:"rule_id" gorm:"not null"`
	WCAGLevel   string    `json:"wcag_level" gorm:"not null"`
	Criterion   string    `json:"criterion" gorm:"not null"`
	Impact      string    `json:"impact" gorm:"not null"`
	Description string    `json:"description" gorm:"not null"`
	Element     string    `json:"element" gorm:"not null"`
	Suggestion  string    `json:"suggestion"`

	// Relationship
	Report ComplianceReport `json:"-" gorm:"foreignKey:ReportID"`
}
