/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using Redis-based rate limiting
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // Map<ip, { count: number, resetTime: number }>

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param {string} identifier - Usually IP address
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
   */
  checkLimit(identifier, limit, windowMs) {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No previous requests or window has passed
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }

    // Within rate limit window
    if (record.count < limit) {
      record.count++;
      return {
        allowed: true,
        remaining: limit - record.count,
        resetTime: record.resetTime
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Strict limit for authentication endpoints
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },

  // Moderate limit for AI/expensive operations
  AI: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many AI requests. Please wait a moment before trying again.'
  },

  // General API limit
  API: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  },

  // Admin operations
  ADMIN: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin operations. Please wait a moment.'
  }
};

/**
 * Apply rate limiting to a request
 * @param {Request} request - The incoming request
 * @param {object} config - Rate limit configuration
 * @returns {{ allowed: boolean, error?: string, headers: object }}
 */
export function applyRateLimit(request, config = RATE_LIMITS.API) {
  // Get client identifier (IP address)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const result = rateLimiter.checkLimit(ip, config.limit, config.windowMs);

  // Create rate limit headers
  const headers = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    headers['Retry-After'] = retryAfter.toString();

    return {
      allowed: false,
      error: config.message,
      headers
    };
  }

  return {
    allowed: true,
    headers
  };
}
