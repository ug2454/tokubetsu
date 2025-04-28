package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/tokubetsu/internal/handlers"
	"github.com/yourusername/tokubetsu/internal/middleware"
)

func SetupRoutes(app *fiber.App) {
	// Public routes
	app.Get("/", handlers.Welcome)
	app.Post("/api/auth/register", handlers.Register)
	app.Post("/api/auth/login", handlers.Login)

	// Protected routes
	api := app.Group("/api", middleware.Protected())

	// User routes
	api.Get("/user", handlers.GetUser)
	api.Put("/user", handlers.UpdateUser)

	// Project routes
	projects := api.Group("/projects")
	projects.Post("/", handlers.CreateProject)
	projects.Get("/", handlers.ListProjects)
	projects.Get("/:id", handlers.GetProject)
	projects.Put("/:id", handlers.UpdateProject)
	projects.Delete("/:id", handlers.DeleteProject)

	// Scan routes
	scans := projects.Group("/:projectId/scans")
	scans.Post("/", handlers.CreateScan)
	scans.Get("/", handlers.ListScans)
	scans.Get("/:id", handlers.GetScan)
	scans.Delete("/:id", handlers.DeleteScan)

	// Team routes
	team := projects.Group("/:projectId/team")
	team.Post("/invite", handlers.InviteTeamMember)
	team.Put("/invite/:id", handlers.UpdateInvite)
	team.Delete("/invite/:id", handlers.DeleteInvite)
}
