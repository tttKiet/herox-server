import { twitterApiKeyService } from "../services/twitterApiKeyService";
import { logger } from "../utils/logger";
import axios from "axios";

/**
 * Example usage of Twitter API Key Service
 */
async function demonstrateTwitterApiKeyService() {
  try {
    // Initialize the service
    await twitterApiKeyService.initialize();

    // Add a new API key
    const newKey = await twitterApiKeyService.addApiKey({
      apiKey: "your-twitter-api-key",
      name: "Main Twitter API Key",
      description: "Used for main application features",
      status: "active",
    });

    logger.info(`Added new Twitter API key: ${newKey._id}`);

    // Get all keys
    const allKeys = await twitterApiKeyService.getAllApiKeys();
    logger.info(`Found ${allKeys.length} Twitter API keys`);

    // Get key for use
    const keyForUse = await twitterApiKeyService.getApiKeyForUse();
    if (keyForUse) {
      // Example: Use the key to make an API request
      await twitterApiKeyService.useApiKey(
        keyForUse._id!.toString(),
        async (apiKey) => {
          // This function will be called with the API key
          // Make API request using the key
          const response = await axios.get(
            "https://api.twitter.com/2/tweets/123456",
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Get rate limit headers from Twitter response
          const rateLimit = {
            limit: parseInt(response.headers["x-rate-limit-limit"] || "0"),
            remaining: parseInt(
              response.headers["x-rate-limit-remaining"] || "0"
            ),
            reset: parseInt(response.headers["x-rate-limit-reset"] || "0"),
          };

          // Update rate limit information
          await twitterApiKeyService.updateRateLimit(
            keyForUse._id!.toString(),
            rateLimit
          );

          return response.data;
        }
      );
    }

    // Update an API key
    if (allKeys.length > 0) {
      await twitterApiKeyService.updateApiKey(allKeys[0]._id!.toString(), {
        description: "Updated description",
      });
      logger.info(`Updated Twitter API key: ${allKeys[0]._id}`);
    }

    // Reset monthly usage (typically called at the beginning of each month)
    // In production, this would be scheduled with a CRON job
    await twitterApiKeyService.resetMonthlyUsage();

    // Delete a key (if needed)
    // await twitterApiKeyService.deleteApiKey(keyId);
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  demonstrateTwitterApiKeyService()
    .then(() => logger.info("Demonstration completed"))
    .catch((err) => logger.error(`Demonstration failed: ${err.message}`));
}

export { demonstrateTwitterApiKeyService };
