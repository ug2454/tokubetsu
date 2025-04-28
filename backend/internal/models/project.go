package models

import (
	"github.com/google/uuid"
)

type Project struct {
	Base
	UserID      uuid.UUID    `json:"user_id" gorm:"type:uuid;not null"`
	Title       string       `json:"title" gorm:"not null"`
	URL         string       `json:"url"`
	Status      string       `json:"status" gorm:"type:varchar(20);default:'active'"`
	User        User         `json:"user" gorm:"foreignKey:UserID"`
	Scans       []Scan       `json:"scans,omitempty"`
	TeamInvites []TeamInvite `json:"team_invites,omitempty"`
}

type Scan struct {
	Base
	ProjectID  uuid.UUID              `json:"project_id" gorm:"type:uuid;not null"`
	ScanType   string                 `json:"scan_type" gorm:"type:varchar(20);not null"`
	ResultJSON map[string]interface{} `json:"result_json" gorm:"type:jsonb"`
	Summary    string                 `json:"summary"`
	Project    Project                `json:"-" gorm:"foreignKey:ProjectID"`
	Issues     []AccessibilityIssue   `json:"issues,omitempty"`
}

type AccessibilityIssue struct {
	Base
	ScanID           uuid.UUID              `json:"scan_id" gorm:"type:uuid;not null"`
	Severity         string                 `json:"severity" gorm:"type:varchar(20);not null"`
	Description      string                 `json:"description" gorm:"not null"`
	HTMLSnippet      string                 `json:"html_snippet"`
	FixSuggestion    string                 `json:"fix_suggestion"`
	SimulatorEffects map[string]interface{} `json:"simulator_effects" gorm:"type:jsonb"`
	Scan             Scan                   `json:"-" gorm:"foreignKey:ScanID"`
}

type TeamInvite struct {
	Base
	ProjectID    uuid.UUID `json:"project_id" gorm:"type:uuid;not null"`
	InvitedEmail string    `json:"invited_email" gorm:"not null"`
	Role         string    `json:"role" gorm:"type:varchar(20);not null"`
	Status       string    `json:"status" gorm:"type:varchar(20);default:'pending'"`
	Project      Project   `json:"-" gorm:"foreignKey:ProjectID"`
}
