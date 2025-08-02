import { ApiKeyTwitterManager } from "../utils/mongoDb/models/ApiKeyTwitterManager";
import { IApiKeyTwitter } from "../utils/mongoDb/interfaces/ApiKeyTwitter";
import { logger } from "../utils/logger";

/**
 * Service for managing Twitter API Keys
 */
class TwitterApiKeyService {
  private manager: ApiKeyTwitterManager;
  private initialized = false;

  constructor() {
    this.manager = new ApiKeyTwitterManager();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.manager.initialize();
      this.initialized = true;

      // Schedule refresh of rate-limited keys
      this.scheduleRateLimitRefresh();

      logger.info("TwitterApiKeyService initialized successfully");
    } catch (error: any) {
      logger.error(
        `Failed to initialize TwitterApiKeyService: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Add a new Twitter API key
   */
  async addApiKey(keyData: {
    apiKey: string;
    name: string;
    description?: string;
    status?: IApiKeyTwitter["status"];
  }): Promise<IApiKeyTwitter> {
    await this.ensureInitialized();

    const key: Omit<IApiKeyTwitter, "_id" | "createdAt" | "updatedAt"> = {
      apiKey: keyData.apiKey,
      name: keyData.name,
      description: keyData.description,
      status: keyData.status || "active",
      usageThisMonth: 0,
      totalUsageCount: 0,
      monthlyUsage: {},
    };

    return this.manager.addKey(key);
  }

  /**
   * Get all Twitter API keys
   */
  async getAllApiKeys(): Promise<IApiKeyTwitter[]> {
    await this.ensureInitialized();
    return this.manager.getAllKeys();
  }

  /**
   * Get active Twitter API keys
   */
  async getActiveApiKeys(): Promise<IApiKeyTwitter[]> {
    await this.ensureInitialized();
    return this.manager.getKeysByStatus("active");
  }

  /**
   * Get a Twitter API key by ID
   */
  async getApiKeyById(id: string): Promise<IApiKeyTwitter | null> {
    await this.ensureInitialized();
    return this.manager.getKeyById(id);
  }

  /**
   * Update a Twitter API key
   */
  async updateApiKey(
    id: string,
    updates: Partial<Pick<IApiKeyTwitter, "name" | "description" | "status">>
  ): Promise<IApiKeyTwitter | null> {
    await this.ensureInitialized();
    return this.manager.updateKey(id, updates);
  }

  /**
   * Delete a Twitter API key
   */
  async deleteApiKey(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.manager.deleteKey(id);
  }

  /**
   * Get an API key for use
   * Will prioritize keys with the lowest usage this month
   */
  async getApiKeyForUse(): Promise<IApiKeyTwitter | null> {
    await this.ensureInitialized();
    return this.manager.getAvailableKey();
  }

  /**
   * Use a Twitter API key and record usage
   * @param id The key ID
   * @param fn The function that uses the API key
   * @returns The result of the function
   */
  async useApiKey<T>(
    id: string,
    fn: (apiKey: string) => Promise<T>
  ): Promise<T> {
    await this.ensureInitialized();

    // Get the key
    const key = await this.manager.getKeyById(id);
    if (!key) {
      throw new Error(`Twitter API key not found: ${id}`);
    }

    if (key.status !== "active") {
      throw new Error(
        `Twitter API key is not active: ${id}, status: ${key.status}`
      );
    }

    try {
      // Use the key
      const result = await fn(key.apiKey);

      // Record usage without error
      await this.manager.recordUsage(id);

      return result;
    } catch (error: any) {
      // Record usage with error
      await this.manager.recordUsage(id, error.message);
      throw error;
    }
  }

  /**
   * Update rate limit information for a key
   */
  async updateRateLimit(
    id: string,
    rateLimit: { limit: number; remaining: number; reset: Date | number }
  ): Promise<void> {
    await this.ensureInitialized();

    // Convert timestamp to Date if needed
    const resetDate =
      typeof rateLimit.reset === "number"
        ? new Date(rateLimit.reset * 1000) // Convert seconds to milliseconds
        : rateLimit.reset;

    await this.manager.updateRateLimit(id, {
      ...rateLimit,
      reset: resetDate,
    });
  }

  /**
   * Reset monthly usage counters (typically called at the beginning of each month)
   */
  async resetMonthlyUsage(): Promise<void> {
    await this.ensureInitialized();
    await this.manager.resetMonthlyUsage();
  }

  /**
   * Refresh rate-limited keys that have passed their reset time
   */
  async refreshRateLimitedKeys(): Promise<number> {
    await this.ensureInitialized();
    return this.manager.refreshRateLimitedKeys();
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Schedule periodic refresh of rate-limited keys
   */
  private scheduleRateLimitRefresh(): void {
    // Check every minute for keys that can be refreshed
    const intervalMs = 60 * 1000; // 1 minute

    setInterval(async () => {
      try {
        const refreshedCount = await this.refreshRateLimitedKeys();
        if (refreshedCount > 0) {
          logger.info(
            `Refreshed ${refreshedCount} rate-limited Twitter API keys`
          );
        }
      } catch (error: any) {
        logger.error(`Error refreshing rate-limited keys: ${error.message}`);
      }
    }, intervalMs);
  }
}

// Export as a singleton instance
export const twitterApiKeyService = new TwitterApiKeyService();
