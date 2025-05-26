package routes

import (
	"tokubetsu/internal/handlers"
	"tokubetsu/internal/middleware"
	"tokubetsu/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Create handlers
	projectHandler := handlers.NewProjectHandler(db)
	scanHandler := handlers.NewScanHandler()
	complianceHandler := handlers.NewComplianceHandler(db, services.NewScanner())
	analyticsHandler := handlers.NewAnalyticsHandler()

	// Public routes
	public := r.Group("/api/public")
	{
		public.GET("/scan", scanHandler.ScanHandler)
	}

	// Auth routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware(db))
	{
		// User route
		api.GET("/user", handlers.GetCurrentUser)

		// Analytics routes
		api.GET("/analytics", analyticsHandler.GetAnalytics)

		// Scan routes
		api.GET("/scans", handlers.ListScans)

		// Activity Log routes
		api.GET("/activity", handlers.ListActivityLogs)

		// Project routes
		projects := api.Group("/projects")
		{
			projects.GET("", projectHandler.ListProjects)
			projects.POST("", projectHandler.CreateProject)
			projects.GET("/:projectId", projectHandler.GetProject)
			projects.PUT("/:projectId", projectHandler.UpdateProject)
			projects.DELETE("/:projectId", projectHandler.DeleteProject)
			projects.POST("/:projectId/scan", projectHandler.RunScan)

			// Compliance report routes for projects
			projects.POST("/:projectId/compliance", complianceHandler.GenerateReport)
			projects.GET("/:projectId/compliance", complianceHandler.GetProjectReports)
		}

		// Compliance report routes
		compliance := api.Group("/compliance")
		{
			compliance.GET("/:reportId", complianceHandler.GetReport)
		}
	}
}
