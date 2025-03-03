package handlers

import (
	"blog_post/db_aws"
	"blog_post/models"

	"fmt"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	gomail "gopkg.in/gomail.v2"
	"gorm.io/gorm"
	"log"
	"os"
	"time"
)

func HandleUserInfo(ctx *fiber.Ctx, db *gorm.DB) error {
	userID := ctx.Params("userId")

	user := models.User{}
	if err := db.Where("id = ?", userID).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	return ctx.JSON(fiber.Map{
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"email":     user.Email,
		"imageUrl":  user.Image,
	})
}

func HandlePasswordForgotten(ctx *fiber.Ctx, db *gorm.DB) error {
	var Body struct {
		Email string `json:"email"`
	}

	if err := ctx.BodyParser(&Body); err != nil {
		return ctx.JSON(fiber.Map{"error": "Invalid request body"})
	}

	user := models.User{}
	if err := db.Where("email = ?", Body.Email).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"error": "Failed to retrieve user"})
	}

	if user.ID == "" {
		return ctx.JSON(fiber.Map{"error": "Invalid email"})
	}

	code := uuid.New().String()[:6]

	codeData := models.Code{
		ID:       uuid.New().String(),
		UserID:   user.ID,
		Code:     code,
		ExpireAt: time.Now().Add(105 * time.Second),
	}

	if err := db.Create(&codeData).Error; err != nil {
		return ctx.JSON(fiber.Map{"error": "Failed to create code"})
	}

	err := SendEmail(Body.Email, code)
	if err != nil {
		return ctx.JSON(fiber.Map{"error": "Failed to send email"})
	}

	return ctx.JSON(fiber.Map{"message": "Email sent"})
}

func HandleUpdateUserInfo(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	var Body struct {
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Email     string `json:"email"`
	}

	if err := ctx.BodyParser(&Body); err != nil {
		return ctx.JSON(fiber.Map{"message": "Invalid request body"})
	}

	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.JSON(fiber.Map{"message": "User not authenticated"})
	}

	user := models.User{}
	if err := db.Where("id = ?", userID).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	user.FirstName = Body.FirstName
	user.LastName = Body.LastName
	user.Email = Body.Email

	if file, err := ctx.FormFile("image"); err == nil && file != nil {
		imageKey := uuid.New().String() + file.Filename
		fileContent, err := file.Open()
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to open file"})
		}
		defer fileContent.Close()

		if user.Image != "" {
			if err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, user.Image); err != nil {
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete old image"})
			}
		}

		imageUrl, err := db_aws.StoreDataToS3(ctx.Context(), s3Client, imageKey, fileContent)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to upload image"})
		}

		user.Image = imageUrl
	}

	if err := db.Save(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to update user"})
	}

	return ctx.JSON(fiber.Map{"message": "User Info updated successfully"})
}

func HandleUpdatePassword(ctx *fiber.Ctx, db *gorm.DB) error {
	var Body struct {
		NewPassword string `json:"newPassword"`
	}

	if err := ctx.BodyParser(&Body); err != nil {
		return ctx.JSON(fiber.Map{"message": "Invalid request body"})
	}

	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.JSON(fiber.Map{"message": "User not authenticated"})
	}

	user := models.User{}
	if err := db.Where("id = ?", userID).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	hashedPassword, err := db_aws.HashPassword(Body.NewPassword)
	if err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to hash password"})
	}

	user.HashPassword = hashedPassword

	if err := db.Save(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to update user"})
	}

	return ctx.JSON(fiber.Map{"message": "Password updated successfully"})
}

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

func HandleDeleteUser(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client) error {
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.JSON(fiber.Map{"message": "User not authenticated"})
	}

	user := models.User{}
	if err := db.Where("id = ?", userID).Find(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to retrieve user"})
	}

	if err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, user.Image); err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to delete user image"})
	}

	if err := db.Where("post_id IN (SELECT id FROM posts WHERE user_id = ?)", userID).Delete(&models.PostTag{}).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to delete post tags"})
	}

	if err := db.Delete(&user).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to delete user"})
	}

	return ctx.JSON(fiber.Map{"message": "User deleted successfully"})
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
	if err := db.Preload("Comments", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at DESC").Preload("User").Preload("Likes")
	}).Preload("Likes").Preload("Tags").Find(&posts).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to retrieve posts"})
	}

	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "User not authenticated"})
	}

	var result []fiber.Map
	for _, post := range posts {
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
				"updatedAt": comment.UpdatedAt,
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

		newPost := fiber.Map{
			"id": post.ID,
			"user": fiber.Map{
				"id":   post.UserID,
				"name": post.User.FirstName,
			},
			"title":     post.Title,
			"body":      post.Body,
			"imageUrl":  post.Image,
			"likeCount": len(post.Likes),
			"likedByMe": likedByMe,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"comments":  comments,
			"tags":      post.Tags,
		}

		result = append(result, newPost)
	}

	return ctx.JSON(result)
}

func HandleAddPost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client, clients map[*websocket.Conn]bool) error {
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
		defer fileContent.Close()

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
		"type": "POST_ADDED",
		"data": fiber.Map{
			"id": post.ID,
			"user": fiber.Map{
				"id":   post.UserID,
				"name": post.User.FirstName,
			},
			"title":     post.Title,
			"body":      post.Body,
			"likeCount": 0,
			"likedByMe": false,
			"createdAt": post.CreatedAt,
			"updatedAt": post.UpdatedAt,
			"imageUrl":  post.Image,
			"tags":      post.Tags,
		},
	}

	BroadcastMessage(newPost, clients)

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Post added successfully"})
}

func HandleUpdatePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client, clients map[*websocket.Conn]bool) error {
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
		defer fileContent.Close()

		if post.ImageKey != "" && post.ImageKey != imageKey {
			if err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, post.ImageKey); err != nil {
				tx.Rollback()
				log.Println("Error deleting image from S3:", err)
				return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete image on S3"})
			}
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

	updatedPost := (fiber.Map{
		"type": "POST_UPDATED",
		"data": fiber.Map{
			"id":        post.ID,
			"title":     post.Title,
			"body":      post.Body,
			"updatedAt": post.UpdatedAt,
			"imageUrl":  post.Image,
			"tags":      post.Tags,
		},
	})

	BroadcastMessage(updatedPost, clients)

	return ctx.Status(fiber.StatusOK).JSON("message", "Post updated")
}

func HandleDeletePost(ctx *fiber.Ctx, db *gorm.DB, s3Client *s3.Client, clients map[*websocket.Conn]bool) error {
	postID := ctx.Params("id")
	post := models.Post{}
	if err := db.First(&post, "id = ?", postID).Error; err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Post not found"})
	}

	err := db_aws.DeleteDataFromS3(ctx.Context(), s3Client, post.ImageKey)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete image on S3"})
	}

	if err := db.Where("post_id = ?", postID).Delete(&models.PostTag{}).Error; err != nil {
		return ctx.JSON(fiber.Map{"message": "Failed to delete post tags"})
	}

	if err := db.Delete(&post).Error; err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to delete post"})
	}

	deletedPost := (fiber.Map{
		"type": "POST_DELETED",
		"data": fiber.Map{
			"id": post.ID,
		},
	})

	BroadcastMessage(deletedPost, clients)

	return ctx.Status(fiber.StatusOK).JSON("message", "Post deleted")
}

func HandleToggleLikePost(ctx *fiber.Ctx, db *gorm.DB, clients map[*websocket.Conn]bool) error {
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

		postUnliked := (fiber.Map{
			"type": "POST_LIKED",
			"data": fiber.Map{
				"id":      postID,
				"message": "like Removed",
				"addLike": false,
				"userId":  userID,
			}})

		BroadcastMessage(postUnliked, clients)

		return ctx.Status(fiber.StatusOK).JSON("message", "Post Unliked")
	} else {
		newLike := models.PostLike{UserID: userID, PostID: postID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add like"})
		}
		postLiked := (fiber.Map{
			"type": "POST_LIKED",
			"data": fiber.Map{
				"id":      postID,
				"message": "Like added",
				"addLike": true,
				"userId":  userID,
			}})

		BroadcastMessage(postLiked, clients)

		return ctx.Status(fiber.StatusOK).JSON("message", "Post Liked")
	}
}

func HandleAddComment(ctx *fiber.Ctx, db *gorm.DB, clients map[*websocket.Conn]bool) error {
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
		"type": "COMMENT_ADDED",
		"data": fiber.Map{
			"postId": postID,
			"comment": fiber.Map{
				"id":        comment.ID,
				"message":   comment.Message,
				"createdAt": comment.CreatedAt,
				"updatedAt": comment.UpdatedAt,
				"likeCount": 0,
				"likedByMe": false,
				"parentId":  comment.ParentID,
				"user": fiber.Map{
					"id":   comment.User.ID,
					"name": comment.User.FirstName,
				},
			},
		},
	})

	BroadcastMessage(newComment, clients)

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Comment added successfully"})
}

func HandleUpdateComment(ctx *fiber.Ctx, db *gorm.DB, clients map[*websocket.Conn]bool) error {
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

	updatedComment := fiber.Map(fiber.Map{
		"type": "COMMENT_UPDATED",
		"data": fiber.Map{
			"postId":    comment.PostID,
			"commentId": comment.ID,
			"message":   comment.Message,
			"updatedAt": comment.UpdatedAt,
		},
	})

	BroadcastMessage(updatedComment, clients)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Comment updated successfully"})
}

func HandleDeleteComment(ctx *fiber.Ctx, db *gorm.DB, clients map[*websocket.Conn]bool) error {
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

	deletedComment := fiber.Map(fiber.Map{
		"type": "COMMENT_DELETED",
		"data": fiber.Map{
			"postId":    comment.PostID,
			"commentId": commentID,
		},
	})

	BroadcastMessage(deletedComment, clients)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Comment deleted successfully"})
}

func HandleToggleCommentLike(ctx *fiber.Ctx, db *gorm.DB, clients map[*websocket.Conn]bool) error {
	commentID := ctx.Params("commentId")
	userID := ctx.Cookies("userId")
	if userID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "User not authenticated"})
	}

	var postID string
	db.Model(&models.Comment{}).Where("id = ?", commentID).Pluck("post_id", &postID)

	like := models.CommentLike{}
	if err := db.Where("user_id = ? AND comment_id = ?", userID, commentID).First(&like).Error; err == nil {
		if err := db.Delete(&like).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to remove like"})
		}

		commentUnliked := fiber.Map{
			"type": "COMMENT_LIKED",
			"data": fiber.Map{
				"postId":    postID,
				"commentId": commentID,
				"addLike":   false,
				"userId":    userID,
			},
		}

		BroadcastMessage(commentUnliked, clients)
		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Comment Unliked"})
	} else {
		newLike := models.CommentLike{UserID: userID, CommentID: commentID}
		if err := db.Create(&newLike).Error; err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Failed to add like"})
		}

		commentLiked := fiber.Map{
			"type": "COMMENT_LIKED",
			"data": fiber.Map{
				"postId":    postID,
				"commentId": commentID,
				"addLike":   true,
				"userId":    userID,
			},
		}

		BroadcastMessage(commentLiked, clients)
		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Comment Liked"})
	}
}

func HandleWebSocket(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		c.Locals("allowed", true)
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func WebSocketHandler(c *websocket.Conn, clients map[*websocket.Conn]bool) {
	log.Println("WebSocket client connected")
	clients[c] = true
	defer func() {
		delete(clients, c)
		log.Println("WebSocket client disconnected")
		c.Close()
	}()

	for {
		var message interface{}
		err := c.ReadJSON(&message)
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}
	}
}

func BroadcastMessage(message interface{}, clients map[*websocket.Conn]bool) {
	for client := range clients {
		err := client.WriteJSON(message)
		if err != nil {
			log.Println("WebSocket write error:", err)

			delete(clients, client)
		}
	}
}

func SendEmail(recipientEmail string, code string) error {
	emailBody := fmt.Sprintf("Your password reset code is: %s. It will expire in 1 minute and 45 seconds.", code)

	msg := gomail.NewMessage()
	msg.SetHeader("From", os.Getenv("EMAIL"))
	msg.SetHeader("To", recipientEmail)
	msg.SetHeader("Subject", "Password Reset Code")
	msg.SetBody("text/plain", emailBody)

	dialer := gomail.NewDialer("smtp.gmail.com", 587, os.Getenv("EMAIL"), os.Getenv("EMAIL_PASSWORD"))

	if err := dialer.DialAndSend(msg); err != nil {
		log.Println("Failed to send email:", err)
		return err
	}

	return nil
}
