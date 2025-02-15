package main

import (
	"blog_post/db_aws"
	"blog_post/handlers"
	"blog_post/seeds"

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

	s3Client, err := db_aws.NewS3Client()
	if err != nil {
		log.Fatalf("Failed to create S3 client: %v", err)
	}

	db := db_aws.InitDb()
	seeds.Seed(db)

	app := fiber.New()
	var clients = make(map[*websocket.Conn]bool)

	blogPost := app.Group("/blog_post")

	blogPost.Use(cors.New(cors.Config{
		AllowOrigins:     "https://hsley13.github.io",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Accept,Content-Type,Authorization",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length",
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
		port = "12346"
	}
	log.Printf("Server is running on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
