package main

import (
	"comment/handlers"
	"comment/models"
	"comment/seeds"
	"github.com/gofiber/fiber/v2"
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

	// Middleware to set user ID cookie
	app.Use(func(ctx *fiber.Ctx) error {
		userId := ctx.Cookies("userId")
		if userId == "" {
			user := getOrCreateUser(db, "Sley")
			ctx.Cookie(&fiber.Cookie{
				Name:    "userId",
				Value:   user.ID, // Use UUID directly (no need to convert to int)
				Expires: time.Now().Add(24 * time.Hour),
			})
		}
		return ctx.Next()
	})

	app.Get("/posts", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPosts(ctx, db)
	})
	app.Get("/posts/:id", func(ctx *fiber.Ctx) error {
		return handlers.HandleGetPost(ctx, db)
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

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // Default port if not set
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

	// Enable UUID extension in PostgreSQL
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		log.Fatalf("Failed to enable UUID extension: %v", err)
	}

	// Auto-migrate models
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
