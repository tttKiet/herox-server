import Redis from "ioredis";
import "dotenv/config";
import { logger } from "../logger";

// Redis connection configuration from environment variables
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

// Ensure REDIS_DB is a valid integer between 0 and 15
let REDIS_DB = 0;
try {
  const parsedDb = parseInt(process.env.REDIS_DB || "0", 10);
  REDIS_DB = !isNaN(parsedDb) && parsedDb >= 0 && parsedDb <= 15 ? parsedDb : 0;
} catch (e) {
  REDIS_DB = 0; // Default to database 0 if parsing fails
}

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Setup and initialize Redis connection
 * @param config Optional custom configuration parameters
 * @returns The Redis client instance
 */
export async function setupCache(config?: {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number | null;
}): Promise<Redis> {
  // If client already exists and is connected, return it
  if (redisClient && redisClient.status === "ready") {
    logger.info("Redis client already connected");
    return redisClient;
  }

  // Close existing connection if exists but not ready
  if (redisClient) {
    logger.info("Closing existing Redis connection");
    await redisClient.quit();
    redisClient = null;
  }

  // Create new Redis client with provided config or defaults
  // Ensure DB is a valid number
  let dbToUse = REDIS_DB;
  if (config?.db !== undefined) {
    dbToUse =
      Number.isInteger(config.db) && config.db >= 0 && config.db <= 15
        ? config.db
        : 0;
  }

  // Log connection details
  logger.info(
    `Connecting to Redis at ${config?.host || REDIS_HOST}:${
      config?.port || REDIS_PORT
    } using database ${dbToUse}`
  );

  redisClient = new Redis({
    host: config?.host || REDIS_HOST,
    port: config?.port || REDIS_PORT,
    password: config?.password || REDIS_PASSWORD || undefined,
    db: dbToUse,
    retryStrategy:
      config?.retryStrategy ||
      ((times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }),
  });

  // Setup event listeners
  redisClient.on("connect", () => {
    logger.info(
      `Connected to Redis at ${redisClient?.options.host}:${redisClient?.options.port}`
    );
  });

  redisClient.on("error", (error) => {
    logger.error(`Redis Error: ${error.message}`);
  });

  redisClient.on("reconnecting", () => {
    logger.info("Redis reconnecting...");
  });

  // Wait for connection to be ready
  try {
    await new Promise<void>((resolve, reject) => {
      if (!redisClient) {
        return reject(new Error("Redis client is null"));
      }

      // Set timeout for connection
      const timeout = setTimeout(() => {
        reject(new Error("Redis connection timeout"));
      }, 5000);

      redisClient.once("ready", () => {
        clearTimeout(timeout);
        resolve();
      });

      redisClient.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    logger.info("Redis setup completed successfully");
    return redisClient;
  } catch (error: any) {
    logger.error(`Redis setup failed: ${error.message}`);
    throw new Error(`Failed to setup Redis: ${error.message}`);
  }
}

// Function to ensure Redis client is initialized
async function ensureRedisClient(): Promise<Redis> {
  if (!redisClient) {
    return await setupCache();
  }
  return redisClient;
}

/**
 * Set a key-value pair with optional expiration
 * @param key The key to set
 * @param value The value to set (will be JSON stringified if not a string)
 * @param expireSeconds Expiration time in seconds (optional)
 */
export async function setCache(
  key: string,
  value: any,
  expireSeconds?: number
): Promise<void> {
  try {
    const client = await ensureRedisClient();
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (expireSeconds) {
      await client.set(key, stringValue, "EX", expireSeconds);
    } else {
      await client.set(key, stringValue);
    }
    logger.info(`Cache set: ${key}`);
  } catch (error: any) {
    logger.error(`Error setting cache: ${error.message}`);
    throw new Error(`Failed to set cache: ${error.message}`);
  }
}

/**
 * Get a value from cache
 * @param key The key to retrieve
 * @param parseJson Whether to parse the result as JSON (default: true)
 * @returns The cached value or null if not found
 */
export async function getCache(key: string, parseJson = true): Promise<any> {
  try {
    const client = await ensureRedisClient();
    const value = await client.get(key);

    if (value === null) {
      return null;
    }

    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (error) {
        // If parsing fails, return as is
        return value;
      }
    }

    return value;
  } catch (error: any) {
    logger.error(`Error getting cache: ${error.message}`);
    return null;
  }
}

/**
 * Delete a key from cache
 * @param key The key to delete
 * @returns True if key was deleted, false otherwise
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const client = await ensureRedisClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error: any) {
    logger.error(`Error deleting cache: ${error.message}`);
    return false;
  }
}

/**
 * Check if a key exists in cache
 * @param key The key to check
 * @returns True if key exists, false otherwise
 */
export async function hasCache(key: string): Promise<boolean> {
  try {
    const client = await ensureRedisClient();
    return (await client.exists(key)) === 1;
  } catch (error: any) {
    logger.error(`Error checking cache existence: ${error.message}`);
    return false;
  }
}

/**
 * Set cache expiration time for an existing key
 * @param key The key to set expiration for
 * @param expireSeconds Expiration time in seconds
 * @returns True if expiration was set, false otherwise
 */
export async function expireCache(
  key: string,
  expireSeconds: number
): Promise<boolean> {
  try {
    const client = await ensureRedisClient();
    return (await client.expire(key, expireSeconds)) === 1;
  } catch (error: any) {
    logger.error(`Error setting cache expiration: ${error.message}`);
    return false;
  }
}

/**
 * Get remaining time to live for a key in seconds
 * @param key The key to check
 * @returns Remaining time in seconds, -1 if key has no expiry, -2 if key does not exist
 */
export async function getTTL(key: string): Promise<number> {
  try {
    const client = await ensureRedisClient();
    return await client.ttl(key);
  } catch (error: any) {
    logger.error(`Error getting TTL: ${error.message}`);
    return -2;
  }
}

/**
 * Increment a counter in Redis
 * @param key The key to increment
 * @param increment The amount to increment (default: 1)
 * @returns The new value
 */
export async function incrementCounter(
  key: string,
  increment = 1
): Promise<number> {
  try {
    const client = await ensureRedisClient();
    return await client.incrby(key, increment);
  } catch (error: any) {
    logger.error(`Error incrementing counter: ${error.message}`);
    throw error;
  }
}

/**
 * Hash map operations
 */
export const hashCache = {
  /**
   * Set a field in a hash map
   * @param key The hash key
   * @param field The field name
   * @param value The value to set
   */
  async set(key: string, field: string, value: any): Promise<void> {
    try {
      const client = await ensureRedisClient();
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await client.hset(key, field, stringValue);
    } catch (error: any) {
      logger.error(`Error setting hash field: ${error.message}`);
      throw error;
    }
  },

  /**
   * Get a field from a hash map
   * @param key The hash key
   * @param field The field name
   * @param parseJson Whether to parse the result as JSON (default: true)
   * @returns The field value or null if not found
   */
  async get(key: string, field: string, parseJson = true): Promise<any> {
    try {
      const client = await ensureRedisClient();
      const value = await client.hget(key, field);

      if (value === null) {
        return null;
      }

      if (parseJson) {
        try {
          return JSON.parse(value);
        } catch (error) {
          // If parsing fails, return as is
          return value;
        }
      }

      return value;
    } catch (error: any) {
      logger.error(`Error getting hash field: ${error.message}`);
      return null;
    }
  },

  /**
   * Get all fields and values from a hash map
   * @param key The hash key
   * @param parseJson Whether to parse the values as JSON (default: true)
   * @returns Object with all fields and values
   */
  async getAll(key: string, parseJson = true): Promise<Record<string, any>> {
    try {
      const client = await ensureRedisClient();
      const result = await client.hgetall(key);

      if (!result) {
        return {};
      }

      if (parseJson) {
        const parsed: Record<string, any> = {};
        for (const field in result) {
          try {
            parsed[field] = JSON.parse(result[field]);
          } catch (error) {
            parsed[field] = result[field];
          }
        }
        return parsed;
      }

      return result;
    } catch (error: any) {
      logger.error(`Error getting all hash fields: ${error.message}`);
      return {};
    }
  },
};

/**
 * Close Redis connection
 * @returns Promise that resolves when connection is closed
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    logger.info("Closing Redis connection");
    await redisClient.quit();
    redisClient = null;
  }
}

const redisUtils = {
  setup: setupCache,
  close: closeRedisConnection,
  set: setCache,
  get: getCache,
  del: deleteCache,
  has: hasCache,
  expire: expireCache,
  ttl: getTTL,
  increment: incrementCounter,
  hash: hashCache,
};

export default redisUtils;
