package db_aws

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"comment/models"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	// "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"golang.org/x/crypto/argon2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	memory      = 64 * 1024
	iterations  = 3
	parallelism = 2
	saltLength  = 16
	keyLength   = 32
)

const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#&?!~^-$%*+"

func GenerateRandomSalt(length int) (string, error) {
	salt := make([]byte, length)

	for i := 0; i < length; i++ {
		index, err := rand.Int(rand.Reader, big.NewInt(int64(len(validChars))))
		if err != nil {
			return "", err
		}
		salt[i] = validChars[index.Int64()]
	}

	return string(salt), nil
}

func HashPassword(password string) (string, error) {
	salt, err := GenerateRandomSalt(saltLength)
	if err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), []byte(salt), iterations, memory, uint8(parallelism), keyLength)

	saltEncoded := base64.RawStdEncoding.EncodeToString([]byte(salt))
	hashEncoded := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("%s$%s", saltEncoded, hashEncoded), nil
}

func VerifyPassword(password string, hashedPassword string) (bool, error) {
	parts := strings.Split(hashedPassword, "$")
	if len(parts) != 2 {
		return false, errors.New("Invalid hashed password format")
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[0])
	if err != nil {
		return false, err
	}

	storedHash, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil {
		return false, err
	}

	computedHash := argon2.IDKey([]byte(password), salt, iterations, memory, uint8(parallelism), keyLength)

	return string(computedHash) == string(storedHash), nil
}

func NewS3Client(ctx context.Context) (*s3.Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}
	return s3.NewFromConfig(cfg), nil
}

func GetDataFromS3(ctx context.Context, s3Client *s3.Client, key string) (string, error) {
	bucket := os.Getenv("BUCKET_NAME")
	if bucket == "" {
		return "", fmt.Errorf("BUCKET_NAME environment variable is not set")
	}

	input := &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}

	result, err := s3Client.GetObject(ctx, input)
	if err != nil {
		return "", fmt.Errorf("Failed to get object: %v", err)
	}
	defer result.Body.Close()

	body, err := io.ReadAll(result.Body)
	if err != nil {
		return "", fmt.Errorf("Failed to read object body: %v", err)
	}

	return string(body), nil
}

func StoreDataToS3(ctx context.Context, s3Client *s3.Client, key string, data string) (string, error) {
	bucket := os.Getenv("BUCKET_NAME")
	if bucket == "" {
		return "", fmt.Errorf("BUCKET_NAME environment variable is not set")
	}

	input := &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader([]byte(data)),
	}

	_, err := s3Client.PutObject(ctx, input)
	if err != nil {
		return "", fmt.Errorf("Failed to upload object: %v", err)
	}

	psClient := s3.NewPresignClient(s3Client)
	psInput := &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}
	psURL, err := psClient.PresignGetObject(ctx, psInput, func(po *s3.PresignOptions) {
		po.Expires = 7 * 24 * time.Hour
	})
	if err != nil {
		return "", fmt.Errorf("Failed to generate presigned URL: %v", err)
	}

	return psURL.URL, nil
}

func DeleteDataFromS3(ctx context.Context, s3Client *s3.Client, key string) (bool, error) {
	bucket := os.Getenv("BUCKET_NAME")
	if bucket == "" {
		return false, fmt.Errorf("BUCKET_NAME environment variable is not set")
	}

	input := &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}

	_, err := s3Client.DeleteObject(ctx, input)
	if err != nil {
		return false, fmt.Errorf("Failed to delete object: %v", err)
	}

	log.Printf("Successfully deleted object: %s/%s\n", bucket, key)
	return true, nil
}

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
