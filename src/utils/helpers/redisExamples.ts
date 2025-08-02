// Example usage of Redis in the project
import { redis } from "../../utils";
import { logger } from "../../utils/logger";

/**
 * Example function showing how to use Redis for caching X post data
 * @param postId The X post ID
 * @param data The post data to cache
 * @param expirationSeconds Time in seconds until cache expires
 */
export async function cacheXPostData(
  postId: string,
  data: any,
  expirationSeconds: number = 3600
): Promise<void> {
  try {
    const cacheKey = `x_post:${postId}`;
    await redis.set(cacheKey, data, expirationSeconds);
    logger.info(
      `Cached X post data for postId: ${postId}, expires in ${expirationSeconds}s`
    );
  } catch (error: any) {
    logger.error(`Failed to cache X post data: ${error.message}`);
  }
}

/**
 * Get cached X post data
 * @param postId The X post ID
 * @returns The cached post data or null if not found
 */
export async function getCachedXPostData(postId: string): Promise<any> {
  try {
    const cacheKey = `x_post:${postId}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.info(`Using cached data for X post: ${postId}`);
      return cachedData;
    }

    logger.info(`No cached data found for X post: ${postId}`);
    return null;
  } catch (error: any) {
    logger.error(`Error retrieving cached X post data: ${error.message}`);
    return null;
  }
}

/**
 * Example function showing how to use Redis for rate limiting
 * @param userId User identifier
 * @param action Action being performed
 * @param limit Maximum allowed actions per period
 * @param periodSeconds Time period in seconds
 * @returns Object with information about rate limiting status
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number = 100,
  periodSeconds: number = 3600
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `ratelimit:${action}:${userId}`;

  try {
    // Check if counter exists
    const exists = await redis.has(key);

    if (!exists) {
      // First request in this period
      await redis.set(key, 1, periodSeconds);
      return {
        allowed: true,
        remaining: limit - 1,
        resetIn: periodSeconds,
      };
    }

    // Get current count and TTL
    const count = parseInt((await redis.get(key, false)) || "0");
    const ttl = await redis.ttl(key);

    if (count < limit) {
      // Increment counter
      await redis.increment(key, 1);
      return {
        allowed: true,
        remaining: limit - (count + 1),
        resetIn: ttl,
      };
    } else {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetIn: ttl,
      };
    }
  } catch (error: any) {
    logger.error(`Rate limiting error: ${error.message}`);
    // Default to allowing the request in case of error
    return {
      allowed: true,
      remaining: 0,
      resetIn: 0,
    };
  }
}

/**
 * Example function showing how to use Redis hash maps for user session data
 * @param userId User identifier
 * @param data Session data to store
 */
export async function storeUserSession(
  userId: string,
  data: Record<string, any>
): Promise<void> {
  const key = `user_session:${userId}`;

  try {
    // Store each field in the hash map
    for (const [field, value] of Object.entries(data)) {
      await redis.hash.set(key, field, value);
    }

    // Set expiration for the entire hash
    await redis.expire(key, 86400); // 24 hours
    logger.info(`Stored session data for user ${userId}`);
  } catch (error: any) {
    logger.error(`Error storing user session: ${error.message}`);
  }
}

/**
 * Get user session data
 * @param userId User identifier
 * @returns Session data object
 */
export async function getUserSession(
  userId: string
): Promise<Record<string, any>> {
  const key = `user_session:${userId}`;

  try {
    return await redis.hash.getAll(key);
  } catch (error: any) {
    logger.error(`Error getting user session: ${error.message}`);
    return {};
  }
}
