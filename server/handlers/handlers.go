package handlers

import (
	"comment/db_aws"
	"comment/models"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"log"
	"time"
)

func HandleSignIn(ctx *fiber.Ctx, db *gorm.DB) error {
	var Body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := ctx.BodyParser(&Body); err != nil {
		return ctx.JSON(fiber.Map{"message": "Invalid request body"})
	}

	user := models.User{}
	if err := db.Where("email = ?", Body.Email).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	if user.ID == "" {
		return ctx.JSON(fiber.Map{"message": "Invalid email"})
	}

	if err := db_aws.VerifyPassword(Body.Password, user.HashPassword); err != nil {
		return ctx.JSON(fiber.Map{"message": "Invalid password"})
	}

	ctx.Cookie(&fiber.Cookie{
		Name:    "userId",
		Value:   user.ID,
		Expires: time.Now().Add(24 * time.Hour),
	})

	newUser := fiber.Map{
		"id":        user.ID,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"email":     user.Email,
	}

	return ctx.JSON(newUser)
}

func HandleSignUp(ctx *fiber.Ctx, db *gorm.DB) error {
	var Body struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email"`
		Password  string `json:"password"`
	}

	if err := ctx.BodyParser(&Body); err != nil {
		return ctx.JSON(fiber.Map{"message": "Invalid request body"})
	}

	existingUser := models.User{}
	if err := db.Where("email = ?", Body.Email).Find(&existingUser).Error; err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	if existingUser.ID != "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "User already exists"})
	}

	hashedPassword, err := db_aws.HashPassword(Body.Password)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Failed to hash password"})
	}

	user := models.User{
		ID:           uuid.New().String(),
		FirstName:    Body.FirstName,
		LastName:     Body.LastName,
		Email:        Body.Email,
		HashPassword: hashedPassword,
	}

	if err := db.Create(&user).Error; err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Failed to create user"})
	}

	ctx.Cookie(&fiber.Cookie{
		Name:    "userId",
		Value:   user.ID,
		Expires: time.Now().Add(24 * time.Hour),
	})

	newUser := fiber.Map{
		"id":        user.ID,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"email":     user.Email,
	}

	return ctx.JSON(newUser)
}

func HandleGetTags(ctx *fiber.Ctx, db *gorm.DB) error {
	tags := []models.Tag{}
	if err := db.Find(&tags).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve tags"})
	}
	return ctx.JSON(tags)
}

func HandleGetPosts(ctx *fiber.Ctx, db *gorm.DB) error {
	posts := []models.Post{}
	if err := db.Preload("Tags").Select("id", "title", "created_at", "updated_at").Order("updated_at DESC").Find(&posts).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve posts"})
	}

	userID := ctx.Cookies("userId")
	userPostLikes := []models.PostLike{}
	if userID != "" {
		if err := db.Where("user_id = ?", userID).Find(&userPostLikes).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve user post likes"})
		}
	}

	postsWithLikes := []fiber.Map{}
	for _, post := range posts {
		var likeCount int64
		if err := db.Model(&models.PostLike{}).Where("post_id = ?", post.ID).Count(&likeCount).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to count post likes"})
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
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"tags":      post.Tags,
		})
	}

	return ctx.JSON(postsWithLikes)
}

func HandleGetPost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("id")
	post := models.Post{}

	if err := db.Preload("Comments", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Preload("User").Preload("Likes")
	}).First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Post not found"})
	}

	if err := db.Preload("Likes").First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Post not found"})
	}

	if err := db.Preload("Tags").First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Posts not found"})
	}

	userID := ctx.Cookies("userId")
	userCommentLikes := []models.CommentLike{}
	if err := db.Where("user_id = ?", userID).Find(&userCommentLikes).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve user comment likes"})
	}

	comments := []fiber.Map{}
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
				"name": comment.User.FirstName,
			},
			"likeCount": len(comment.Likes),
			"likedByMe": likedByMe,
		})
	}

	userPostLikes := []models.PostLike{}
	if err := db.Where("user_id = ?", userID).Find(&userPostLikes).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve user post likes"})
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
		"updatedAt": post.UpdatedAt,
		"comments":  comments,
		"tags":      post.Tags,
	})
}

func HandleAddPost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	var body struct {
		UserId string   `json:"userId"`
		Title  string   `json:"title"`
		Body   string   `json:"body"`
		Tags   []string `json:"tags"`
	}

	if err := ctx.BodyParser(&body); err != nil || body.UserId == "" || body.Title == "" || body.Body == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Title, body, and UserId are required"})
	}

	tx := db.Begin()

	tags := []models.Tag{}
	for _, tagName := range body.Tags {
		tag := models.Tag{}
		if err := tx.Where("name = ?", tagName).First(&tag).Error; err != nil {
			if err := tx.Create(&models.Tag{Name: tagName}).Error; err != nil {
				tx.Rollback()
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to create tag"})
			}
			tx.Where("name = ?", tagName).First(&tag)
		}
		tags = append(tags, tag)
	}

	var imageUrl string
	var imageKey string
	if file, err := ctx.FormFile("image"); err == nil && file != nil {
		imageKey = uuid.New().String() + file.Filename

		fileContent, err := file.Open()
		if err != nil {
			tx.Rollback()
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to open file"})
		}

		imageUrl, err = db_aws.StoreDataToS3(ctx.Context(), s3Client, imageKey, fileContent)
		if err != nil {
			tx.Rollback()
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to upload image to S3"})
		}
	} else {
		tx.Rollback()
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Image is required"})
	}

	post := models.Post{
		UserID:    body.UserId,
		Title:     body.Title,
		Body:      body.Body,
		Likes:     []models.PostLike{},
		Image:     imageUrl,
		ImageKey:  imageKey,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Tags:      tags,
	}

	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback()
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add post"})
	}

	if err := tx.Commit().Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to commit transaction"})
	}

	newPost := fiber.Map{
		"id":        post.ID,
		"userId":    post.UserID,
		"title":     post.Title,
		"body":      post.Body,
		"likeCount": 0,
		"likedByMe": false,
		"createdAt": post.CreatedAt,
		"updatedAt": post.UpdatedAt,
		"imageUrl":  post.Image,
		"tags":      post.Tags,
	}

	return ctx.Status(fiber.StatusCreated).JSON(newPost)
}

func HandleUpdatePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	postID := ctx.Params("id")
	var body struct {
		Title string   `json:"title"`
		Body  string   `json:"body"`
		Tags  []string `json:"tags"`
	}

	if err := ctx.BodyParser(&body); err != nil || body.Title == "" || body.Body == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Title and body are required"})
	}

	post := models.Post{}
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Post not found"})
	}

	tx := db.Begin()

	post.Title = body.Title
	post.Body = body.Body
	post.UpdatedAt = time.Now()

	if file, err := ctx.FormFile("image"); err == nil && file != nil {
		imageKey := uuid.New().String() + file.Filename

		fileContent, err := file.Open()
		if err != nil {
			tx.Rollback()
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to open file"})
		}

		if err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, post.ImageKey); err != nil {
			tx.Rollback()
			log.Println("Error deleting image from S3:", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete image on S3"})
		}

		imageUrl, err := db_aws.StoreDataToS3(ctx.Context(), s3Client, imageKey, fileContent)
		if err != nil {
			tx.Rollback()
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to upload image"})
		}

		post.Image = imageUrl
		post.ImageKey = imageKey
	}

	tags := []models.Tag{}
	for _, tagName := range body.Tags {
		tag := models.Tag{}
		if err := tx.Where("name = ?", tagName).First(&tag).Error; err != nil {
			if err := tx.Create(&models.Tag{Name: tagName}).Error; err != nil {
				tx.Rollback()
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to create tag"})
			}
			tx.Where("name = ?", tagName).First(&tag)
		}
		tags = append(tags, tag)
	}

	if err := tx.Save(&post).Error; err != nil {
		tx.Rollback()
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to update post"})
	}

	if err := tx.Model(&post).Association("Tags").Replace(tags); err != nil {
		tx.Rollback()
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to update post tags"})
	}

	if err := tx.Commit().Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Transaction failed"})
	}

	return ctx.JSON(fiber.Map{
		"id":        post.ID,
		"title":     post.Title,
		"body":      post.Body,
		"updatedAt": post.UpdatedAt,
		"imageUrl":  post.Image,
		"tags":      post.Tags,
	})
}

func HandleDeletePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	postID := ctx.Params("id")
	post := models.Post{}
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Post not found"})
	}

	err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, post.ImageKey)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete image on S3"})
	}

	if err := db.Delete(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete post"})
	}

	return ctx.JSON(fiber.Map{
		"id":      post.ID,
		"message": "Post deleted successfully"})
}

func HandleToggleLikePost(ctx *fiber.Ctx, db *gorm.DB) error {
	postID := ctx.Params("postId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "User not authenticated"})
	}

	like := models.PostLike{}
	if err := db.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      postID,
			"message": "Like removed",
			"addLike": false})
	} else {
		newLike := models.PostLike{UserID: userID, PostID: postID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add like"})
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
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Message is required"})
	}

	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "User not authenticated"})
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
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add comment"})
	}

	if err := db.Preload("User").First(&comment, "id = ?", comment.ID).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve comment details"})
	}

	newComment := fiber.Map(fiber.Map{
		"id":        comment.ID,
		"message":   comment.Message,
		"parentId":  comment.ParentID,
		"createdAt": comment.CreatedAt,
		"user": fiber.Map{
			"id":   comment.User.ID,
			"name": comment.User.FirstName,
		},
		"likeCount": 0,
		"likedByMe": false,
	})

	return ctx.Status(fiber.StatusCreated).JSON(newComment)
}

func HandleUpdateComment(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	var body struct {
		Message string `json:"message"`
	}
	if err := ctx.BodyParser(&body); err != nil || body.Message == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Message is required"})
	}

	comment := models.Comment{}
	if err := db.First(&comment, "id = ?", commentID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Comment not found"})
	}

	userID := ctx.Cookies("userId")
	if comment.UserID != userID {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "You do not have permission to edit this comment"})
	}

	comment.Message = body.Message
	comment.UpdatedAt = time.Now()
	if err := db.Save(&comment).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to update comment"})
	}

	return ctx.JSON(fiber.Map{
		"id":        comment.ID,
		"message":   comment.Message,
		"updatedAt": comment.UpdatedAt,
	})
}

func HandleDeleteComment(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	comment := models.Comment{}
	if err := db.First(&comment, "id = ?", commentID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Comment not found"})
	}

	userID := ctx.Cookies("userId")
	if comment.UserID != userID {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "You do not have permission to delete this comment"})
	}

	if err := db.Delete(&comment).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete comment"})
	}

	return ctx.JSON(fiber.Map{"message": "Comment deleted"})
}

func HandleToggleCommentLike(ctx *fiber.Ctx, db *gorm.DB) error {
	commentID := ctx.Params("commentId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "User not authenticated"})
	}

	like := models.CommentLike{}
	if err := db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to remove like"})
		}
		return ctx.JSON(fiber.Map{
			"id":      commentID,
			"message": "Like removed",
			"addLike": false})
	} else {
		newLike := models.CommentLike{UserID: userID, CommentID: commentID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add like"})
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
