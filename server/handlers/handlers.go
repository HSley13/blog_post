package handlers

import (
	"comment/models"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"os"
	"time"
)

func InitDb() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		log.Fatalf("Failed to enable UUID extension: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Post{}, &models.Comment{}, &models.Like{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func GetOrCreateUser(db *gorm.DB, username string) models.User {
	var user models.User
	if err := db.Where("name = ?", username).First(&user).Error; err != nil {
		user = models.User{Name: username}
		if createErr := db.Create(&user).Error; createErr != nil {
			log.Fatalf("Failed to create user: %v", createErr)
		}
	}
	return user
}

func HandleGetPosts(ctx *fiber.Ctx, db *gorm.DB) error {
	var posts []models.Post
	if err := db.Select("id", "title", "updated_at").Find(&posts).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve posts"})
	}
	return ctx.JSON(posts)
}

func HandleGetPost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("id")
	var post models.Post

	// Fetch the post with its comments, including nested relationships
	if err := db.Preload("Comments", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Preload("User").Preload("Likes")
	}).First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	// Get the current user's likes
	userID := ctx.Cookies("userId")
	var userLikes []models.Like
	if err := db.Where("user_id = ?", userID).Find(&userLikes).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user likes"})
	}

	// Map comments with like information
	var comments []fiber.Map
	for _, comment := range post.Comments {
		likedByMe := false
		for _, like := range userLikes {
			if like.CommentID == comment.ID {
				likedByMe = true
				break
			}
		}
		comments = append(comments, fiber.Map{
			"id":        comment.ID,
			"message":   comment.Message,
			"parentId":  comment.ParentID,
			"createdAt": comment.CreatedAt,
			"user": fiber.Map{
				"id":   comment.User.ID,
				"name": comment.User.Name,
			},
			"likeCount": len(comment.Likes),
			"likedByMe": likedByMe,
		})
	}

	return ctx.JSON(fiber.Map{
		"id":       post.ID,
		"userId":   post.UserID,
		"title":    post.Title,
		"body":     post.Body,
		"comments": comments,
	})
}

func HandleAddPost(ctx *fiber.Ctx, db *gorm.DB) error {
	var body struct {
		UserId string `json:"userId"`
		Title  string `json:"title"`
		Body   string `json:"body"`
	}
	if err := ctx.BodyParser(&body); err != nil || body.UserId == "" || body.Title == "" || body.Body == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title and body are required"})
	}

	post := models.Post{
		UserID:    body.UserId,
		Title:     body.Title,
		Body:      body.Body,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := db.Create(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add post"})
	}

	newPost := (fiber.Map{
		"id":        post.ID,
		"userId":    post.UserID,
		"title":     post.Title,
		"body":      post.Body,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
	})

	BroadcastMessage(map[string]interface{}{
		"type": "NEW_POST",
		"data": newPost,
	})

	return ctx.Status(fiber.StatusCreated).JSON(newPost)
}

func HandleUpdatePost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("id")
	var body struct {
		Title string `json:"title"`
		Body  string `json:"body"`
	}
	if err := ctx.BodyParser(&body); err != nil || body.Title == "" || body.Body == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title and body are required"})
	}

	var post models.Post
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	post.Title = body.Title
	post.Body = body.Body
	post.UpdatedAt = time.Now()

	if err := db.Save(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update post"})
	}

	return ctx.JSON(fiber.Map{
		"id":        post.ID,
		"title":     post.Title,
		"body":      post.Body,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
	})
}

func HandleDeletePost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("id")
	var post models.Post
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	if err := db.Delete(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete post"})
	}

	return ctx.JSON(fiber.Map{
		"id":      post.ID,
		"message": "Post deleted successfully"})
}

func HandleAddComment(ctx *fiber.Ctx, db *gorm.DB) error {
	var body struct {
		Message  string  `json:"message"`
		ParentID *string `json:"parentId"`
	}
	if err := ctx.BodyParser(&body); err != nil || body.Message == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Message is required"})
	}

	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
	}

	postID := ctx.Params("id")
	comment := models.Comment{
		Message:   body.Message,
		UserID:    userID,
		ParentID:  body.ParentID,
		PostID:    postID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := db.Create(&comment).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add comment"})
	}

	if err := db.Preload("User").First(&comment, "id = ?", comment.ID).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve comment details"})
	}

	newComment := fiber.Map(fiber.Map{
		"id":        comment.ID,
		"message":   comment.Message,
		"parentId":  comment.ParentID,
		"createdAt": comment.CreatedAt,
		"user": fiber.Map{
			"id":   comment.User.ID,
			"name": comment.User.Name,
		},
		"likeCount": 0,
		"likedByMe": false,
	})

	BroadcastMessage(map[string]interface{}{
		"type": "NEW_COMMENT",
		"data": newComment,
	})

	return ctx.Status(fiber.StatusCreated).JSON(newComment)
}

func HandleUpdateComment(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	var body struct {
		Message string `json:"message"`
	}
	if err := ctx.BodyParser(&body); err != nil || body.Message == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Message is required"})
	}

	var comment models.Comment
	if err := db.First(&comment, "id = ?", commentID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Comment not found"})
	}

	userID := ctx.Cookies("userId")
	if comment.UserID != userID {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "You do not have permission to edit this comment"})
	}

	comment.Message = body.Message
	comment.UpdatedAt = time.Now()
	if err := db.Save(&comment).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update comment"})
	}

	return ctx.JSON(fiber.Map{
		"id":        comment.ID,
		"message":   comment.Message,
		"updatedAt": comment.UpdatedAt,
	})
}

func HandleDeleteComment(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	var comment models.Comment
	if err := db.First(&comment, "id = ?", commentID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Comment not found"})
	}

	userID := ctx.Cookies("userId")
	if comment.UserID != userID {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "You do not have permission to delete this comment"})
	}

	if err := db.Delete(&comment).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete comment"})
	}

	return ctx.JSON(fiber.Map{"message": "Comment deleted"})
}

func HandleToggleLike(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
	}

	var like models.Like
	if err := db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      commentID,
			"message": "Like removed",
			"addLike": false})
	} else {
		newLike := models.Like{UserID: userID, CommentID: commentID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      commentID,
			"message": "Like added",
			"addLike": true})
	}
}

var clients = make(map[*websocket.Conn]bool)

func HandleWebSocket(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		c.Locals("allowed", true)
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func WebSocketHandler(c *websocket.Conn) {
	log.Println("WebSocket client connected")
	clients[c] = true
	defer func() {
		delete(clients, c)
		c.Close()
	}()
}

func BroadcastMessage(message interface{}) {
	log.Println("Broadcasting new message")
	for client := range clients {
		err := client.WriteJSON(message)
		if err != nil {
			log.Println("WebSocket write error:", err)
			client.Close()
			delete(clients, client)
		}
	}
}
