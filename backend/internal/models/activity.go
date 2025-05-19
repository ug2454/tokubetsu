package models

import (
	"time"

	"github.com/google/uuid"
)

// ActivityLog records significant events in the system.
type ActivityLog struct {
	Base
	UserID uuid.UUID `json:"user_id" gorm:"type:uuid"` // User who performed the action
	Action string    `json:"action" gorm:"not null"`   // e.g., "Project 'X' created", "Scan started for 'Y'"
	// Timestamp will be taken from Base.CreatedAt for simplicity and consistency
	ProjectID *uuid.UUID `json:"project_id,omitempty" gorm:"type:uuid"` // Optional: Associated project
	Details   string     `json:"details,omitempty"`                     // Optional: More details as JSON or text
	Type      string     `json:"type" gorm:"not null"`                  // e.g., "project", "scan", "user", "compliance" for categorization/icons

	User    User     `json:"-" gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Project *Project `json:"-" gorm:"foreignKey:ProjectID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

// ActivityLogResponse is used for sending activity data to the client,
// potentially including project_name if ProjectID is present.
type ActivityLogResponse struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Action      string     `json:"action"`
	Timestamp   time.Time  `json:"timestamp"` // This will be Base.CreatedAt
	ProjectID   *uuid.UUID `json:"project_id,omitempty"`
	ProjectName *string    `json:"project_name,omitempty"`
	Details     string     `json:"details,omitempty"`
	Type        string     `json:"type"`
}
