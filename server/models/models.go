package models

import (
	"time"
)

type Tag struct {
	ID    string `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Name  string `gorm:"not null;size:255;unique" json:"name"`
	Posts []Post `gorm:"many2many:post_tags;" json:"posts"`
}

type PostTag struct {
	PostID string `gorm:"primaryKey;type:uuid" json:"post_id"`
	TagID  string `gorm:"primaryKey;type:uuid" json:"tag_id"`
	Post   Post   `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"post"`
	Tag    Tag    `gorm:"foreignKey:TagID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"tag"`
}

type PostLike struct {
	UserID string `gorm:"primaryKey;type:uuid" json:"user_id"`
	PostID string `gorm:"primaryKey;type:uuid" json:"post_id"`
	User   User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"user"`
	Post   Post   `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"post"`
}

type CommentLike struct {
	UserID    string  `gorm:"primaryKey;type:uuid" json:"user_id"`
	CommentID string  `gorm:"primaryKey;type:uuid" json:"comment_id"`
	User      User    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"user"`
	Comment   Comment `gorm:"foreignKey:CommentID;constraint:OnDelete:CASCADE;onUpdate:CASCADE;" json:"comment"`
}

type Code struct {
	ID       string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID   string    `gorm:"not null;type:uuid;index" json:"user_id"`
	User     User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"user"`
	Code     string    `gorm:"not null;type:text" json:"code"`
	ExpireAt time.Time `gorm:"not null" json:"expire_at"`
}

type User struct {
	ID           string        `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	FirstName    string        `gorm:"not null;size:100" json:"first_name"`
	LastName     string        `gorm:"not null;size:100" json:"last_name"`
	Email        string        `gorm:"not null;size:100;unique" json:"email"`
	HashPassword string        `gorm:"not null;size:100" json:"hash_password"`
	Image        string        `gorm:"type:text" json:"image"`
	Comments     []Comment     `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"comments"`
	Posts        []Post        `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"posts"`
	PostLikes    []PostLike    `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"post_likes"`
	CommentLikes []CommentLike `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"comment_likes"`
}

type Post struct {
	ID        string     `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Title     string     `gorm:"not null;size:255" json:"title"`
	CreatedAt time.Time  `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	Body      string     `gorm:"not null;type:text" json:"body"`
	UserID    string     `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"user"`
	Image     string     `gorm:"type:text" json:"image"`
	ImageKey  string     `gorm:"type:text" json:"image_key"`
	Comments  []Comment  `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"comments"`
	Likes     []PostLike `gorm:"constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"likes"`
	Tags      []Tag      `gorm:"many2many:post_tags;" json:"tags"`
}

type Comment struct {
	ID        string        `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	Message   string        `gorm:"not null;type:text" json:"message"`
	CreatedAt time.Time     `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time     `gorm:"not null;default:now();autoUpdateTime" json:"updated_at"`
	UserID    string        `gorm:"not null;type:uuid;index" json:"user_id"`
	User      User          `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"user"`
	PostID    string        `gorm:"not null;type:uuid;index" json:"post_id"`
	Post      Post          `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"post"`
	ParentID  *string       `gorm:"type:uuid;index" json:"parent_id"`
	Parent    *Comment      `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"parent"`
	Children  []Comment     `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;onUpdate:CASCADE" json:"children"`
	Likes     []CommentLike `gorm:"constraint:OnDelete:CASCADE;" json:"likes"`
}
