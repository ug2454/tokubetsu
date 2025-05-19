package models

import (
	"time"

	"github.com/google/uuid"
)

// Session represents a user session
type Session struct {
	Base
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Token     string    `json:"token" gorm:"not null;unique"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
}
