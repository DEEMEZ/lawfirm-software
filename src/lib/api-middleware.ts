// API Middleware
// Purpose: Combine error handling, rate limiting, and request processing

import { NextRequest, NextResponse } from 'next/server'
import { handleAPIError, ErrorLogger, ErrorSeverity, ErrorType } from './error-handler'
import { RateLimiter, rateLimiters } from './rate-limiter'
import { v4 as uuidv4 } from 'uuid'

// Request context interface
export interface RequestContext {
  requestId: string
  startTime: number
  ip: string
  userAgent: string
  method: string
  url: string
  userId?: string
  lawFirmId?: string
}

// Middleware options
export interface MiddlewareOptions {
  rateLimit?: RateLimiter | keyof typeof rateLimiters
  enableLogging?: boolean
  enableMetrics?: boolean
  cors?: {
    origins?: string[]
    methods?: string[]
    headers?: string[]
  }
}

// API response wrapper
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    type: string
    message: string
    code?: string
    details?: any
    timestamp: string
    requestId: string
  }
  meta?: {
    requestId: string
    timestamp: string
    processingTime: number
  }
}

// Middleware class
export class APIMiddleware {
  private static generateRequestId(): string {
    return uuidv4()
  }

  private static createRequestContext(request: NextRequest): RequestContext {
    return {
      requestId: this.generateRequestId(),
      startTime: Date.now(),
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      method: request.method,
      url: request.url,
      userId: request.headers.get('x-user-id') || undefined,
      lawFirmId: request.headers.get('x-law-firm-id') || undefined
    }
  }

  private static getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    return realIP || 'unknown'
  }

  // Main middleware wrapper
  public static withMiddleware(
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
    options: MiddlewareOptions = {}
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const context = this.createRequestContext(request)

      try {
        // Apply CORS if configured
        if (options.cors) {
          const corsResponse = this.handleCORS(request, options.cors)
          if (corsResponse) return corsResponse
        }

        // Apply rate limiting if configured
        if (options.rateLimit) {
          await this.applyRateLimit(request, options.rateLimit, context)
        }

        // Log request if enabled
        if (options.enableLogging) {
          this.logRequest(context)
        }

        // Execute the main handler
        const response = await handler(request, context)

        // Add standard headers
        this.addStandardHeaders(response, context)

        // Log response if enabled
        if (options.enableLogging) {
          this.logResponse(context, response.status)
        }

        return response

      } catch (error) {
        // Handle errors with context
        const errorResponse = handleAPIError(
          error,
          context.requestId,
          context.userId,
          context.lawFirmId
        )

        // Add standard headers to error response
        this.addStandardHeaders(errorResponse, context)

        // Log error response
        if (options.enableLogging) {
          this.logResponse(context, errorResponse.status, error)
        }

        return errorResponse
      }
    }
  }

  // CORS handling
  private static handleCORS(
    request: NextRequest,
    corsConfig: NonNullable<MiddlewareOptions['cors']>
  ): NextResponse | null {
    const origin = request.headers.get('origin')
    const method = request.method

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })

      if (corsConfig.origins) {
        if (origin && corsConfig.origins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin)
        }
      } else {
        response.headers.set('Access-Control-Allow-Origin', '*')
      }

      if (corsConfig.methods) {
        response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
      } else {
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      }

      if (corsConfig.headers) {
        response.headers.set('Access-Control-Allow-Headers', corsConfig.headers.join(', '))
      } else {
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Law-Firm-ID, X-User-ID')
      }

      response.headers.set('Access-Control-Max-Age', '86400')
      return response
    }

    return null
  }

  // Rate limiting
  private static async applyRateLimit(
    request: NextRequest,
    rateLimit: RateLimiter | keyof typeof rateLimiters,
    context: RequestContext
  ): Promise<void> {
    const limiter = typeof rateLimit === 'string' ? rateLimiters[rateLimit] : rateLimit

    if (!limiter) {
      throw new Error(`Rate limiter not found: ${rateLimit}`)
    }

    const result = await limiter.checkLimit(request)

    if (!result.success) {
      const error = new Error(result.error || 'Rate limit exceeded')
      error.name = 'RateLimitError'
      ;(error as any).statusCode = 429
      ;(error as any).details = {
        limit: result.limit,
        current: result.current,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }
      throw error
    }
  }

  // Add standard response headers
  private static addStandardHeaders(response: NextResponse, context: RequestContext): void {
    response.headers.set('X-Request-ID', context.requestId)
    response.headers.set('X-Timestamp', new Date().toISOString())
    response.headers.set('X-Processing-Time', `${Date.now() - context.startTime}ms`)

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  // Request logging
  private static logRequest(context: RequestContext): void {
    console.log(`📥 ${context.method} ${context.url}`, {
      requestId: context.requestId,
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      lawFirmId: context.lawFirmId,
      timestamp: new Date(context.startTime).toISOString()
    })
  }

  // Response logging
  private static logResponse(
    context: RequestContext,
    statusCode: number,
    error?: unknown
  ): void {
    const processingTime = Date.now() - context.startTime
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    const logData = {
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      statusCode,
      processingTime: `${processingTime}ms`,
      ip: context.ip,
      userId: context.userId,
      lawFirmId: context.lawFirmId
    }

    if (error) {
      console[logLevel](`📤 ${context.method} ${context.url} - ${statusCode} (${processingTime}ms)`, {
        ...logData,
        error: error instanceof Error ? error.message : String(error)
      })
    } else {
      console[logLevel](`📤 ${context.method} ${context.url} - ${statusCode} (${processingTime}ms)`, logData)
    }
  }

  // Create success response
  public static createSuccessResponse<T>(
    data: T,
    context: RequestContext,
    statusCode: number = 200
  ): NextResponse {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: {
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - context.startTime
      }
    }

    return NextResponse.json(response, { status: statusCode })
  }

  // Create paginated response
  public static createPaginatedResponse<T>(
    data: T[],
    context: RequestContext,
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  ): NextResponse {
    const response = {
      success: true,
      data,
      pagination,
      meta: {
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - context.startTime
      }
    }

    return NextResponse.json(response)
  }
}

// Convenience middleware creators
export function withRateLimit(
  limiter: RateLimiter | keyof typeof rateLimiters,
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return APIMiddleware.withMiddleware(handler, { rateLimit: limiter, enableLogging: true })
}

export function withLogging(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return APIMiddleware.withMiddleware(handler, { enableLogging: true })
}

export function withCORS(
  corsConfig: NonNullable<MiddlewareOptions['cors']>,
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return APIMiddleware.withMiddleware(handler, { cors: corsConfig, enableLogging: true })
}

export function withFullMiddleware(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return APIMiddleware.withMiddleware(handler, {
    enableLogging: true,
    enableMetrics: true,
    ...options
  })
}

// Export for convenience
export { APIMiddleware as default }