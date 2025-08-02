// Example: Server initialization with Redis setup
import express from "express";
import { setupCache, closeRedisConnection } from "../utils";
import { logger } from "../utils/logger";

/**
 * Initialize Redis and setup application
 */
async function initializeApp() {
  try {
    // Setup Redis connection
    await setupCache();
    logger.info("Redis connection established successfully");

    // Setup Express server
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware, routes, etc. would be set up here

    // Start server
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
    });

    // Cleanup function for graceful shutdown
    const gracefulShutdown = async () => {
      logger.info("Shutting down server...");

      // Close Redis connection
      await closeRedisConnection();
      logger.info("Redis connection closed");

      // Exit process
      process.exit(0);
    };

    // Listen for termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error: any) {
    logger.error(`Failed to initialize application: ${error.message}`);
    process.exit(1);
  }
}

// Call initialization function
// initializeApp();

export { initializeApp };
