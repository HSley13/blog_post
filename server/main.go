package main

import (
	"comment/db_aws"
	"comment/handlers"
	"comment/seeds"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"context"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"log"
	"os"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	cfg, err := config.LoadDefaultConfig(context.Background(), config.WithRegion("us-east-1"))
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	s3Client := s3.NewFromConfig(cfg)

	db := db_aws.InitDb()
	seeds.Seed(db)

	app := fiber.New()
	var clients = make(map[*websocket.Conn]bool)

	blogPost := app.Group("/blog_post")

	blogPost.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowHeaders:     "Origin,Accept,Content-Type,Authorization",
		AllowCredentials: true,
	}))
	blogPost.Use("/ws", func(ctx *fiber.Ctx) error {
		return handlers.HandleWebSocket(ctx)
	})
	blogPost.Get("/ws/", websocket.New(func(c *websocket.Conn) {
		handlers.WebSocketHandler(c, clients)
	}))
	blogPost.Post("/auth/signIn", func(ctx *fiber.Ctx) error {
		return handlers.HandleSignIn(ctx, db)
	})
	blogPost.Post("/auth/signUp", func(ctx *fiber.Ctx) error {
		return handlers.HandleSignUp(ctx, db)
	})
	blogPost.Get("/auth/userInfo/:userId", func(ctx *fiber.Ctx) error {
		return handlers.HandleUserInfo(ctx, db)
	})
	blogPost.Put("/auth/updateUserInfo", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdateUserInfo(ctx, db, s3Client)
	})
	blogPost.Put("/auth/updatePassword", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdatePassword(ctx, db)
	})
	blogPost.Delete("/auth/deleteUser", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeleteUser(ctx, db, s3Client)
	})
	blogPost.Post("auth/passwordForgotten", func(ctx *fiber.Ctx) error {
		return handlers.HandlePasswordForgotten(ctx, db)
	})
	blogPost.Get("/tags", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetTags(ctx, db)
	})
	blogPost.Get("/posts", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPosts(ctx, db)
	})
	// blogPost.Get("/posts/:id", func(ctx *fiber.Ctx) error {
	// return handlers.HandleGetPost(ctx, db)
	// })
	blogPost.Post("/posts/", func(ctx *fiber.Ctx) error {
		return handlers.HandleAddPost(ctx, db, s3Client, clients)
	})
	blogPost.Put("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdatePost(ctx, db, s3Client, clients)
	})
	blogPost.Delete("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeletePost(ctx, db, s3Client, clients)
	})
	blogPost.Post("/posts/:postId/toggleLike", func(ctx *fiber.Ctx) error {
		return handlers.HandleToggleLikePost(ctx, db, clients)
	})
	blogPost.Post("/posts/:id/comments", func(ctx *fiber.Ctx) error {
		return handlers.HandleAddComment(ctx, db, clients)
	})
	blogPost.Put("/posts/:postId/comments/:commentId", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdateComment(ctx, db, clients)
	})
	blogPost.Delete("/posts/:postId/comments/:commentId", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeleteComment(ctx, db, clients)
	})
	blogPost.Post("/posts/:postId/comments/:commentId/toggleLike", func(ctx *fiber.Ctx) error {
		return handlers.HandleToggleCommentLike(ctx, db, clients)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Printf("Server is running on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
