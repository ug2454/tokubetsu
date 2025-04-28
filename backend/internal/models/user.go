package models

type User struct {
	Base
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"type:varchar(20);default:'user'"`
}

type UserResponse struct {
	Base
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}
