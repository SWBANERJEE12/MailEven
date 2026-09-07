/**
 * In-memory sliding window rate limiter for user actions (Sync, Calendar/Task confirms).
 * Protects Google API quotas and prevents abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 120000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and records a rate-limited action for a user.
 * @param identifier - e.g. `sync:${userId}` or `action:${userId}`
 * @param limit - Maximum requests in the window
 * @param windowMs - Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Remove timestamps older than current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);

  return {
    success: true,
    limit,
    remaining,
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}
