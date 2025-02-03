package main

import (
	"comment/handlers"
	"comment/models"
	"comment/seeds"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/websocket/v2"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"os"
	"time"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	db := initDb()
	seeds.Seed(db)

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowHeaders:     "Origin,Accept,Content-Type,Authorization",
		AllowCredentials: true,
	}))

	app.Use(func(ctx *fiber.Ctx) error {
		user := getOrCreateUser(db, "Sley")
		ctx.Cookie(&fiber.Cookie{
			Name:    "userId",
			Value:   user.ID,
			Expires: time.Now().Add(24 * time.Hour),
		})
		return ctx.Next()
	})

	app.Use("/ws", func(ctx *fiber.Ctx) error {
		return handlers.HandleWebSocket(ctx)
	})
	app.Get("/ws", websocket.New(handlers.WebSocketHandler))
	app.Get("/posts", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPosts(ctx, db)
	})
	app.Get("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPost(ctx, db)
	})
	app.Post("/posts", func(ctx *fiber.Ctx) error {
		return handlers.HandleAddPost(ctx, db)
	})
	app.Put("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleUpdatePost(ctx, db)
	})
	app.Delete("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleDeletePost(ctx, db)
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
		return handlers.HandleToggleLike(ctx, db)
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

func initDb() *gorm.DB {
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

func getOrCreateUser(db *gorm.DB, username string) models.User {
	var user models.User
	if err := db.Where("name = ?", username).First(&user).Error; err != nil {
		user = models.User{Name: username}
		if createErr := db.Create(&user).Error; createErr != nil {
			log.Fatalf("Failed to create user: %v", createErr)
		}
	}
	return user
}
