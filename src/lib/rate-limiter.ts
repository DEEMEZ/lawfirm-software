// Rate Limiting System
// Purpose: Protect API endpoints from abuse with per-firm quotas

import { NextRequest } from 'next/server'
import { RateLimitError } from './error-handler'

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  message?: string // Custom error message
}

// Rate limit result
export interface RateLimitResult {
  success: boolean
  limit: number
  current: number
  remaining: number
  resetTime: number
  error?: string
}

// Rate limit store interface
export interface RateLimitStore {
  increment(key: string): Promise<{ totalHits: number; resetTime: number }>
  decrement(key: string): Promise<void>
  resetKey(key: string): Promise<void>
}

// In-memory rate limit store (for development)
class MemoryStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map()

  async increment(
    key: string
  ): Promise<{ totalHits: number; resetTime: number }> {
    const now = Date.now()
    const current = this.hits.get(key)

    if (!current || now > current.resetTime) {
      // Create new entry or reset expired entry
      const resetTime = now + 60 * 1000 // 1 minute window
      this.hits.set(key, { count: 1, resetTime })
      return { totalHits: 1, resetTime }
    }

    // Increment existing entry
    current.count++
    this.hits.set(key, current)
    return { totalHits: current.count, resetTime: current.resetTime }
  }

  async decrement(key: string): Promise<void> {
    const current = this.hits.get(key)
    if (current && current.count > 0) {
      current.count--
      this.hits.set(key, current)
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key)
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.hits.entries()) {
      if (now > value.resetTime) {
        this.hits.delete(key)
      }
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private store: RateLimitStore
  private config: RateLimitConfig

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = config
    this.store = store || new MemoryStore()

    // Cleanup expired entries every 5 minutes for memory store
    if (this.store instanceof MemoryStore) {
      setInterval(
        () => {
          ;(this.store as MemoryStore).cleanup()
        },
        5 * 60 * 1000
      )
    }
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    try {
      const key = this.generateKey(request)
      const { totalHits, resetTime } = await this.store.increment(key)

      const result: RateLimitResult = {
        success: totalHits <= this.config.maxRequests,
        limit: this.config.maxRequests,
        current: totalHits,
        remaining: Math.max(0, this.config.maxRequests - totalHits),
        resetTime,
      }

      if (!result.success) {
        result.error = this.config.message || 'Rate limit exceeded'
      }

      return result
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // On error, allow the request (fail open)
      return {
        success: true,
        limit: this.config.maxRequests,
        current: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        error: 'Rate limit check failed',
      }
    }
  }

  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request)
    }

    // Default key generation: IP + User Agent hash
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const userAgentHash = this.simpleHash(userAgent)

    return `${ip}:${userAgentHash}`
  }

  private getClientIP(request: NextRequest): string {
    // Check common headers for client IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')

    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwardedFor.split(',')[0].trim()
    }

    return realIP || remoteAddr || 'unknown'
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }
}

// Predefined rate limiters
export const rateLimiters = {
  // Authentication endpoints (stricter limits)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  }),

  // Public API endpoints
  publicAPI: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'API rate limit exceeded, please slow down',
  }),

  // Document upload endpoints
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 uploads per minute
    message:
      'Upload rate limit exceeded, please wait before uploading more files',
  }),

  // Email sending endpoints
  email: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 emails per minute
    message:
      'Email rate limit exceeded, please wait before sending more emails',
  }),

  // General API endpoints (per law firm)
  perFirm: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute per firm
    keyGenerator: (request: NextRequest) => {
      // Extract law firm ID from request (you might get this from JWT or headers)
      const lawFirmId = request.headers.get('x-law-firm-id') || 'unknown'
      return `firm:${lawFirmId}`
    },
    message: 'Firm rate limit exceeded, please reduce request frequency',
  }),

  // Admin endpoints (more lenient for super admins)
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute
    message: 'Admin rate limit exceeded',
  }),
}

// Rate limit middleware creator
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: NextRequest) => {
    const result = await limiter.checkLimit(request)

    if (!result.success) {
      throw new RateLimitError(result.error!, {
        limit: result.limit,
        current: result.current,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      })
    }

    // Add rate limit headers to response (these would be added in the actual response)
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    }
  }
}

// Route-specific rate limit helpers
export const authRateLimit = createRateLimitMiddleware(rateLimiters.auth)
export const publicAPIRateLimit = createRateLimitMiddleware(
  rateLimiters.publicAPI
)
export const uploadRateLimit = createRateLimitMiddleware(rateLimiters.upload)
export const emailRateLimit = createRateLimitMiddleware(rateLimiters.email)
export const firmRateLimit = createRateLimitMiddleware(rateLimiters.perFirm)
export const adminRateLimit = createRateLimitMiddleware(rateLimiters.admin)

// Rate limit status checker
export async function getRateLimitStatus(
  request: NextRequest,
  limiterName: keyof typeof rateLimiters
): Promise<RateLimitResult> {
  const limiter = rateLimiters[limiterName]
  if (!limiter) {
    throw new Error(`Rate limiter '${limiterName}' not found`)
  }

  return limiter.checkLimit(request)
}

// Rate limit reset utility (for admin use)
export async function resetRateLimit(
  limiterName: keyof typeof rateLimiters,
  key: string
): Promise<void> {
  const limiter = rateLimiters[limiterName]
  if (!limiter) {
    throw new Error(`Rate limiter '${limiterName}' not found`)
  }

  await (
    limiter as unknown as {
      store: { resetKey: (key: string) => Promise<void> }
    }
  ).store.resetKey(key)
}

// Rate limit configuration helpers
export function createCustomRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

export function createPerUserRateLimiter(
  windowMs: number,
  maxRequests: number,
  message?: string
): RateLimiter {
  return new RateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id') || 'anonymous'
      return `user:${userId}`
    },
    message: message || 'User rate limit exceeded',
  })
}

export function createPerIPRateLimiter(
  windowMs: number,
  maxRequests: number,
  message?: string
): RateLimiter {
  return new RateLimiter({
    windowMs,
    maxRequests,
    message: message || 'IP rate limit exceeded',
  })
}
