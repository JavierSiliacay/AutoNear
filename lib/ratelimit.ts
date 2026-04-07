import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new Redis instance with safety checks
const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Mock success object for when Redis is missing
const mockSuccess = { success: true, limit: 10, remaining: 10, reset: 0 };

// Create a general rate limiter: 10 requests every 10 seconds
export const generalRatelimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit/general",
    })
  : { limit: async () => mockSuccess };

// Create a strict rate limiter for forms/auth: 3 requests every 1 minute
export const strictRatelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      analytics: true,
      prefix: "@upstash/ratelimit/strict",
    })
  : { limit: async () => mockSuccess };
