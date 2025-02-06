package models

import (
	"time"
)

type PostLike struct {
	UserID string `gorm:"primaryKey;type:uuid" json:"user_id"`
	PostID string `gorm:"primaryKey;type:uuid" json:"post_id"`
	User   User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	Post   Post   `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;" json:"post"`
}

type CommentLike struct {
	UserID    string  `gorm:"primaryKey;type:uuid" json:"user_id"`
	CommentID string  `gorm:"primaryKey;type:uuid" json:"comment_id"`
	User      User    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	Comment   Comment `gorm:"foreignKey:CommentID;constraint:OnDelete:CASCADE;" json:"comment"`
}

type User struct {
	ID           string        `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Name         string        `gorm:"not null;size:100" json:"name"`
	Comments     []Comment     `gorm:"constraint:OnDelete:CASCADE;" json:"comments"`
	Posts        []Post        `gorm:"constraint:OnDelete:CASCADE;" json:"posts"`
	PostLikes    []PostLike    `gorm:"constraint:OnDelete:CASCADE;" json:"post_likes"`
	CommentLikes []CommentLike `gorm:"constraint:OnDelete:CASCADE;" json:"comment_likes"`
}

type Post struct {
	ID        string     `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Title     string     `gorm:"not null;size:255" json:"title"`
	CreatedAt time.Time  `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	Body      string     `gorm:"not null;type:text" json:"body"`
	UserID    string     `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	Image     string     `gorm:"type:text" json:"image"`
	ImageKey  string     `gorm:"type:text" json:"image_key"`
	Comments  []Comment  `gorm:"constraint:OnDelete:CASCADE;" json:"comments"`
	Likes     []PostLike `gorm:"constraint:OnDelete:CASCADE;" json:"likes"`
}

type Comment struct {
	ID        string        `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Message   string        `gorm:"not null;type:text" json:"message"`
	CreatedAt time.Time     `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time     `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	UserID    string        `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User          `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;" json:"user"`
	PostID    string        `gorm:"not null;type:uuid;index" json:"post_id"`
	Post      Post          `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;" json:"post"`
	ParentID  *string       `gorm:"type:uuid;index" json:"parent_id"`
	Parent    *Comment      `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;" json:"parent"`
	Children  []Comment     `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;" json:"children"`
	Likes     []CommentLike `gorm:"constraint:OnDelete:CASCADE;" json:"likes"`
}
