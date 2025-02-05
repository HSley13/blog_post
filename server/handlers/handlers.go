package handlers

import (
	"comment/db_aws"
	"comment/models"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"gorm.io/gorm"
	"log"
	"time"
)

func HandleGetPosts(ctx *fiber.Ctx, db *gorm.DB) error {
	var posts []models.Post
	if err := db.Select("id", "title", "updated_at").Find(&posts).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve posts"})
	}

	userID := ctx.Cookies("userId")
	var userPostLikes []models.PostLike
	if userID != "" {
		if err := db.Where("user_id = ?", userID).Find(&userPostLikes).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user post likes"})
		}
	}

	var postsWithLikes []fiber.Map
	for _, post := range posts {
		var likeCount int64
		if err := db.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likeCount).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to count post likes"})
		}

		likedByMe := false
		for _, like := range userPostLikes {
			if like.PostID == post.ID {
				likedByMe = true
				break
			}
		}

		postsWithLikes = append(postsWithLikes, fiber.Map{
			"id":        post.ID,
			"title":     post.Title,
			"likeCount": likeCount,
			"likedByMe": likedByMe,
			"updatedAt": post.UpdatedAt,
		})
	}

	return ctx.JSON(postsWithLikes)
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

	// Fetch the post with its likes
	if err := db.Preload("Likes").First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	// Get the current user's likes
	userID := ctx.Cookies("userId")
	var userCommentLikes []models.CommentLike
	if err := db.Where("user_id = ?", userID).Find(&userCommentLikes).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user comment likes"})
	}

	// Map comments with like information
	var comments []fiber.Map
	for _, comment := range post.Comments {
		likedByMe := false
		for _, like := range userCommentLikes {
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

	var userPostLikes []models.PostLike
	if err := db.Where("user_id = ?", userID).Find(&userPostLikes).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user post likes"})
	}
	likedByMe := false
	for _, like := range userPostLikes {
		if like.PostID == post.ID {
			likedByMe = true
			break
		}
	}

	return ctx.JSON(fiber.Map{
		"id":        post.ID,
		"userId":    post.UserID,
		"title":     post.Title,
		"body":      post.Body,
		"imageUrl":  post.Image,
		"likeCount": len(post.Likes),
		"likedByMe": likedByMe,
		"createdAt": post.CreatedAt,
		"comments":  comments,
	})
}

func HandleAddPost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	var body struct {
		UserId string `json:"userId"`
		Title  string `json:"title"`
		Body   string `json:"body"`
		Image  string `json:"image"`
	}

	if body.Image == "" {
		log.Println("Image is empty")
	}

	if err := ctx.BodyParser(&body); err != nil || body.UserId == "" || body.Title == "" || body.Body == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Title, body and Image are required"})
	}

	imageUrl := ""
	var err error = nil
	if body.Image != "" {
		imageKey := time.Now().Format("2006-01-02-15-04-05")
		imageUrl, err = db_aws.StoreDataToS3(ctx.Context(), s3Client, imageKey, body.Image)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload image"})
		}
	}

	log.Println("Image URL:", imageUrl)

	post := models.Post{
		UserID:    body.UserId,
		Title:     body.Title,
		Body:      body.Body,
		Likes:     []models.PostLike{},
		Image:     imageUrl,
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
		"likeCount": 0,
		"likedByMe": false,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"imageUrl":  post.Image,
	})

	// BroadcastMessage(map[string]interface{}{
	// 	"type": "NEW_POST",
	// 	"data": newPost,

	return ctx.Status(fiber.StatusCreated).JSON(newPost)
}

func HandleUpdatePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	postID := ctx.Params("id")
	var body struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Image string `json:"image"`
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

	if body.Image != "" {
		imageKey := time.Now().Format("2006-01-02-15-04-05")
		imageUrl, err := db_aws.StoreDataToS3(ctx.Context(), s3Client, imageKey, body.Image)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload image"})
		}

		if imageUrl != "" {
			post.Image = imageUrl
		} else {
			post.Image = ""
			//TODO: delete image from AWS
		}
	}

	if err := db.Save(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update post"})
	}

	return ctx.JSON(fiber.Map{
		"id":        post.ID,
		"title":     post.Title,
		"body":      post.Body,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"imageUrl":  post.Image,
	})
}

func HandleDeletePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	postID := ctx.Params("id")
	var post models.Post
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Post not found"})
	}

	//TODO: delete image from AWS

	if err := db.Delete(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete post"})
	}

	return ctx.JSON(fiber.Map{
		"id":      post.ID,
		"message": "Post deleted successfully"})
}

func HandleToggleLikePost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("postId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
	}

	var like models.PostLike
	if err := db.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      postID,
			"message": "Like removed",
			"addLike": false})
	} else {
		newLike := models.PostLike{UserID: userID, PostID: postID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to add like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      postID,
			"message": "Like added",
			"addLike": true})
	}
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

	// BroadcastMessage(map[string]interface{}{
	// 	"type": "NEW_COMMENT",
	// 	"data": newComment,
	// })

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

func HandleToggleCommentLike(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not authenticated"})
	}

	var like models.CommentLike
	if err := db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      commentID,
			"message": "Like removed",
			"addLike": false})
	} else {
		newLike := models.CommentLike{UserID: userID, CommentID: commentID}
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
		log.Println("WebSocket client disconnected")
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
