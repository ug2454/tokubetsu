package handlers

import "github.com/gofiber/fiber/v2"

func Welcome(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "Welcome to Tokubetsu API",
		"status":  "success",
		"version": "1.0.0",
	})
}
