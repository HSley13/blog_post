package handlers

import (
	"comment/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"time"
)

func HandleGetPosts(ctx *fiber.Ctx, db *gorm.DB) error {
	var posts []models.Post
	if err := db.Select("id", "title").Find(&posts).Error; err != nil {
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
		"post": fiber.Map{
			"id":    post.ID,
			"title": post.Title,
			"body":  post.Body,
		},
		"comments": comments,
	})
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

	// Preload the User relationship
	if err := db.Preload("User").First(&comment, "id = ?", comment.ID).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve comment details"})
	}

	return ctx.JSON(fiber.Map{
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

	// Check if the current user is the owner of the comment
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

	// Check if the current user is the owner of the comment
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
		// Like exists, so remove it
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{"message": "Like removed", "addLike": false})
	} else {
		// Like does not exist, so add it
		newLike := models.Like{UserID: userID, CommentID: commentID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add like"})
		}
		return ctx.JSON(fiber.Map{"message": "Like added", "addLike": true})
	}
}

