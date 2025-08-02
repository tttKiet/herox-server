import { Collection, ObjectId } from "mongodb";
import { IApiKeyTwitter } from "../utils/interfaces";
import { getCollection } from "../utils/mongoDb";
import { logger } from "../utils/logger";

/**
 * Helper function to convert string ID to ObjectId
 */
function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
}

/**
 * Manager class for Twitter API Keys
 */
export class ApiKeyTwitterManager {
  private collection: Collection<IApiKeyTwitter>;
  private readonly COLLECTION_NAME = "apiKeyTwitters";

  constructor() {
    this.collection = getCollection<IApiKeyTwitter>(this.COLLECTION_NAME);
  }

  /**
   * Initialize the API key collection with indexes
   */
  async initialize(): Promise<void> {
    try {
      // Create indexes for performance
      await this.collection.createIndexes([
        { key: { apiKey: 1 }, name: "apiKey", unique: true },
        { key: { status: 1 }, name: "status" },
        { key: { lastUsed: -1 }, name: "lastUsed" },
        { key: { usageThisMonth: 1 }, name: "usageThisMonth" },
      ]);

      logger.info("ApiKeyTwitter collection initialized with indexes");
    } catch (error: any) {
      logger.error(
        `Failed to initialize ApiKeyTwitter collection: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Add a new API key to the collection
   * @param key API key object
   * @returns The created API key document
   */
  async addKey(
    key: Omit<IApiKeyTwitter, "_id" | "createdAt" | "updatedAt">
  ): Promise<IApiKeyTwitter> {
    try {
      // Check if key already exists
      const existing = await this.collection.findOne({ apiKey: key.apiKey });
      if (existing) {
        throw new Error(
          `API key '${key.apiKey.substring(0, 5)}...' already exists`
        );
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      const newKey: IApiKeyTwitter = {
        ...key,
        usageThisMonth: 0,
        totalUsageCount: 0,
        monthlyUsage: { [currentMonth]: 0 },
        createdAt: now,
        updatedAt: now,
      };

      const result = await this.collection.insertOne(newKey as any);

      logger.info(`Added new Twitter API key: ${key.name}`);
      return {
        ...newKey,
        _id: result.insertedId.toString(),
      };
    } catch (error: any) {
      logger.error(`Failed to add Twitter API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing API key
   * @param id API key ID
   * @param updates Fields to update
   * @returns The updated API key document
   */
  async updateKey(
    id: string,
    updates: Partial<Omit<IApiKeyTwitter, "_id" | "createdAt" | "updatedAt">>
  ): Promise<IApiKeyTwitter | null> {
    try {
      const objectId = toObjectId(id);

      // Don't allow updating the key itself for security
      if ("apiKey" in updates) {
        delete updates.apiKey;
      }

      const updatedKey = await this.collection.findOneAndUpdate(
        { _id: objectId as any },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (updatedKey) {
        logger.info(`Updated Twitter API key: ${id}`);
        return updatedKey;
      }

      logger.warn(`Twitter API key not found for update: ${id}`);
      return null;
    } catch (error: any) {
      logger.error(`Failed to update Twitter API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete an API key by ID
   * @param id API key ID
   * @returns True if deleted successfully
   */
  async deleteKey(id: string): Promise<boolean> {
    try {
      const objectId = toObjectId(id);
      const result = await this.collection.deleteOne({ _id: objectId as any });

      if (result.deletedCount > 0) {
        logger.info(`Deleted Twitter API key: ${id}`);
        return true;
      }

      logger.warn(`Twitter API key not found for deletion: ${id}`);
      return false;
    } catch (error: any) {
      logger.error(`Failed to delete Twitter API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get an API key by ID
   * @param id API key ID
   * @returns API key document or null if not found
   */
  async getKeyById(id: string): Promise<IApiKeyTwitter | null> {
    try {
      const objectId = toObjectId(id);
      return await this.collection.findOne({ _id: objectId as any });
    } catch (error: any) {
      logger.error(`Failed to get Twitter API key by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all API keys
   * @param filter Optional filter criteria
   * @returns Array of API key documents
   */
  async getAllKeys(
    filter: Partial<IApiKeyTwitter> = {}
  ): Promise<IApiKeyTwitter[]> {
    try {
      return await this.collection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray();
    } catch (error: any) {
      logger.error(`Failed to get Twitter API keys: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get API keys by status
   * @param status Key status to filter by
   * @returns Array of API key documents
   */
  async getKeysByStatus(
    status: IApiKeyTwitter["status"]
  ): Promise<IApiKeyTwitter[]> {
    try {
      return await this.collection
        .find({ status })
        .sort({ lastUsed: -1 })
        .toArray();
    } catch (error: any) {
      logger.error(
        `Failed to get Twitter API keys by status: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get an available API key for use
   * @returns An active API key or null if none available
   */
  async getAvailableKey(): Promise<IApiKeyTwitter | null> {
    try {
      // Find a key that is active and has the lowest usage this month
      const key = await this.collection.findOne(
        { status: "active" },
        { sort: { usageThisMonth: 1 } }
      );

      return key;
    } catch (error: any) {
      logger.error(`Failed to get available Twitter API key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record usage of an API key
   * @param id API key ID
   * @param error Optional error message if the API call failed
   * @returns The updated API key document
   */
  async recordUsage(
    id: string,
    error?: string
  ): Promise<IApiKeyTwitter | null> {
    try {
      const objectId = toObjectId(id);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      // Prepare the update
      const update: any = {
        lastUsed: now,
        updatedAt: now,
      };

      // If there's an error, update the status and error message
      if (error) {
        update.status = "error";
        update.lastError = error;
      }

      // Update the key usage
      const result = await this.collection.findOneAndUpdate(
        { _id: objectId as any },
        {
          $set: update,
          $inc: {
            usageThisMonth: 1,
            totalUsageCount: 1,
            [`monthlyUsage.${currentMonth}`]: 1,
          },
        },
        { returnDocument: "after" }
      );

      if (result) {
        logger.debug(`Recorded usage for Twitter API key: ${id}`);
        return result;
      }

      logger.warn(`Twitter API key not found for usage recording: ${id}`);
      return null;
    } catch (error: any) {
      logger.error(`Failed to record Twitter API key usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a key's rate limit information
   * @param id API key ID
   * @param rateLimit Rate limit information
   */
  async updateRateLimit(
    id: string,
    rateLimit: {
      limit: number;
      remaining: number;
      reset: Date;
    }
  ): Promise<IApiKeyTwitter | null> {
    try {
      const objectId = toObjectId(id);

      // If remaining is 0, mark as rate limited
      const status = rateLimit.remaining <= 0 ? "rate_limited" : "active";

      const result = await this.collection.findOneAndUpdate(
        { _id: objectId as any },
        {
          $set: {
            rateLimit,
            status,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (result) {
        if (status === "rate_limited") {
          logger.warn(
            `Twitter API key is rate limited: ${id}. Reset at ${rateLimit.reset}`
          );
        }
        return result;
      }

      logger.warn(`Twitter API key not found for rate limit update: ${id}`);
      return null;
    } catch (error: any) {
      logger.error(
        `Failed to update Twitter API key rate limit: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Reset monthly usage counters for all keys (should be called at the beginning of each month)
   * @returns Number of keys that were reset
   */
  async resetMonthlyUsage(): Promise<number> {
    try {
      const result = await this.collection.updateMany(
        {},
        { $set: { usageThisMonth: 0, updatedAt: new Date() } }
      );

      logger.info(
        `Reset monthly usage for ${result.modifiedCount} Twitter API keys`
      );
      return result.modifiedCount;
    } catch (error: any) {
      logger.error(
        `Failed to reset monthly Twitter API key usage: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Refresh rate-limited keys that have passed their reset time
   * @returns Number of keys that were refreshed
   */
  async refreshRateLimitedKeys(): Promise<number> {
    try {
      const now = new Date();

      // Find all rate-limited keys where the reset time has passed
      const result = await this.collection.updateMany(
        {
          status: "rate_limited",
          "rateLimit.reset": { $lte: now },
        },
        {
          $set: {
            status: "active",
            updatedAt: now,
          },
        }
      );

      logger.info(
        `Refreshed ${result.modifiedCount} rate-limited Twitter API keys`
      );
      return result.modifiedCount;
    } catch (error: any) {
      logger.error(
        `Failed to refresh rate-limited Twitter API keys: ${error.message}`
      );
      throw error;
    }
  }
}
