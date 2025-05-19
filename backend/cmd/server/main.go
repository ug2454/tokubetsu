package main

import (
	"log"
	"os"

	"tokubetsu/internal/database"
	"tokubetsu/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	database.Connect()

	// Create Gin router with RedirectTrailingSlash set to false
	router := gin.New()
	router.RedirectTrailingSlash = false
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS middleware - must be before any routing
	router.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "http://localhost:3000" || origin == "http://localhost:3001" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type, Authorization")
			c.Header("Access-Control-Max-Age", "86400") // 24 hours
		}

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.Status(204)
			c.Abort()
			return
		}

		c.Next()
	})

	// Initialize handlers
	// Setup routes
	routes.SetupRoutes(router, database.DB)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
