// Export all Redis functionality from redis.ts
import redisUtils, {
  setupCache,
  closeRedisConnection,
  getCache,
  setCache,
  deleteCache,
  hasCache,
  expireCache,
  getTTL,
  incrementCounter,
  hashCache,
} from "./redis";

// Re-export all functions
export {
  setupCache,
  closeRedisConnection,
  getCache,
  setCache,
  deleteCache,
  hasCache,
  expireCache,
  getTTL,
  incrementCounter,
  hashCache,
};

// Export default
export default redisUtils;
