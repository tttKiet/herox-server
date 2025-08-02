/**
 * Twitter API Key Management Exports
 */

// Re-export the manager

// Re-export the service
export { twitterApiKeyService } from "./services/twitterApiKeyService";

// Export a setup function for convenience
import { twitterApiKeyService } from "./services/twitterApiKeyService";
import { setupDB } from "./utils/mongoDb";

/**
 * Set up Twitter API key management
 * @param mongoUrl MongoDB connection URL
 * @param dbName Database name
 */
export async function setupTwitterApiKeyManagement(
  mongoUrl: string,
  dbName: string
): Promise<void> {
  // Set up MongoDB connection
  await setupDB(mongoUrl, dbName);

  // Initialize the Twitter API key service
  await twitterApiKeyService.initialize();
}
