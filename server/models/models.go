package models

import (
	"time"
)

type Post struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Title     string    `gorm:"not null;size:255" json:"title"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	Body      string    `gorm:"not null;type:text" json:"body"`
	UserID    string    `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	Comments  []Comment `gorm:"constraint:OnDelete:CASCADE;" json:"comments"`
}

type User struct {
	ID       string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Name     string    `gorm:"not null;size:100" json:"name"`
	Comments []Comment `gorm:"constraint:OnDelete:CASCADE;" json:"comments"`
	Posts    []Post    `gorm:"constraint:OnDelete:CASCADE;" json:"posts"`
	Likes    []Like    `gorm:"constraint:OnDelete:CASCADE;" json:"likes"`
}

type Comment struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Message   string    `gorm:"not null;type:text" json:"message"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	UserID    string    `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	PostID    string    `gorm:"not null;type:uuid;index" json:"post_id"`
	Post      Post      `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;" json:"post"`
	ParentID  *string   `gorm:"type:uuid;index" json:"parent_id"`
	Parent    *Comment  `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;" json:"parent"`
	Children  []Comment `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;" json:"children"`
	Likes     []Like    `gorm:"constraint:OnDelete:CASCADE;" json:"likes"`
}

type Like struct {
	UserID    string  `gorm:"primaryKey;type:uuid" json:"user_id"`
	CommentID string  `gorm:"primaryKey;type:uuid" json:"comment_id"`
	User      User    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	Comment   Comment `gorm:"foreignKey:CommentID;constraint:OnDelete:CASCADE;" json:"comment"`
}
