package main

import (
	"comment/db_aws"
	"comment/handlers"
	"comment/seeds"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	// "github.com/gofiber/websocket/v2"
	"context"
	"github.com/joho/godotenv"
	"log"
	"os"
	"time"
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

	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowHeaders:     "Origin,Accept,Content-Type,Authorization",
		AllowCredentials: true,
	}))
	app.Use(func(ctx *fiber.Ctx) error {
		user := db_aws.GetOrCreateUser(db, "Sley")
		ctx.Cookie(&fiber.Cookie{
			Name:    "userId",
			Value:   user.ID,
			Expires: time.Now().Add(24 * time.Hour),
		})
		return ctx.Next()
	})
	// app.Use("/ws", func(ctx *fiber.Ctx) error {
	// 	return handlers.HandleWebSocket(ctx)
	// })
	// app.Get("/ws", websocket.New(handlers.WebSocketHandler))
	app.Get("/tags", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetTags(ctx, db)
	})
	app.Get("/posts", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPosts(ctx, db)
	})
	app.Get("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPost(ctx, db)
	})
	app.Post("/posts/", func(ctx *fiber.Ctx) error {
		return handlers.HandleAddPost(ctx, db, s3Client)
	})
	app.Put("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdatePost(ctx, db, s3Client)
	})
	app.Delete("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeletePost(ctx, db, s3Client)
	})
	app.Post("/posts/:postId/toggleLike", func(ctx *fiber.Ctx) error {
		return handlers.HandleToggleLikePost(ctx, db)
	})
	app.Post("/posts/:id/comments", func(ctx *fiber.Ctx) error {
		return handlers.HandleAddComment(ctx, db)
	})
	app.Put("/posts/:postId/comments/:commentId", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdateComment(ctx, db)
	})
	app.Delete("/posts/:postId/comments/:commentId", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeleteComment(ctx, db)
	})
	app.Post("/posts/:postId/comments/:commentId/toggleLike", func(ctx *fiber.Ctx) error {
		return handlers.HandleToggleCommentLike(ctx, db)
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
