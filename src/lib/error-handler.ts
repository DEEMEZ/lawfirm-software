// Global Error Handler
// Purpose: Centralized error handling with structured responses

import { NextResponse } from 'next/server'

// Error types
export enum ErrorType {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found_error',
  RATE_LIMIT = 'rate_limit_error',
  SERVER = 'server_error',
  EXTERNAL = 'external_service_error',
  DATABASE = 'database_error'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Type for error details - can be validation errors, stack traces, or other contextual data
export type ErrorDetails = 
  | Record<string, unknown>
  | string[]
  | { stack?: string; [key: string]: unknown }
  | null
  | undefined

// Structured error interface
export interface StructuredError {
  type: ErrorType
  message: string
  details?: ErrorDetails
  code?: string
  statusCode: number
  severity: ErrorSeverity
  timestamp: string
  requestId?: string
  userId?: string
  lawFirmId?: string
}

// Custom error classes
export class APIError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly details?: ErrorDetails
  public readonly code?: string

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: ErrorDetails,
    code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    this.type = type
    this.statusCode = statusCode
    this.severity = severity
    this.details = details
    this.code = code
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: ErrorDetails, code?: string) {
    super(ErrorType.VALIDATION, message, 400, ErrorSeverity.LOW, details, code)
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', details?: ErrorDetails, code?: string) {
    super(ErrorType.AUTHENTICATION, message, 401, ErrorSeverity.MEDIUM, details, code)
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions', details?: ErrorDetails, code?: string) {
    super(ErrorType.AUTHORIZATION, message, 403, ErrorSeverity.MEDIUM, details, code)
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found', details?: ErrorDetails, code?: string) {
    super(ErrorType.NOT_FOUND, message, 404, ErrorSeverity.LOW, details, code)
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded', details?: ErrorDetails, code?: string) {
    super(ErrorType.RATE_LIMIT, message, 429, ErrorSeverity.MEDIUM, details, code)
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed', details?: ErrorDetails, code?: string) {
    super(ErrorType.DATABASE, message, 500, ErrorSeverity.HIGH, details, code)
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string = 'External service error', details?: ErrorDetails, code?: string) {
    super(ErrorType.EXTERNAL, `${service}: ${message}`, 502, ErrorSeverity.MEDIUM, details, code)
  }
}

// Error logger
export class ErrorLogger {
  static log(error: StructuredError): void {
    const logLevel = this.getLogLevel(error.severity)
    const logEntry = {
      timestamp: error.timestamp,
      level: logLevel,
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      severity: error.severity,
      requestId: error.requestId,
      userId: error.userId,
      lawFirmId: error.lawFirmId,
      details: error.details,
      code: error.code
    }

    // Log to console (in production, you'd log to your logging service)
    console[logLevel](JSON.stringify(logEntry, null, 2))

    // In production, you might also:
    // - Send to external logging service (e.g., Sentry, LogRocket)
    // - Store in database for audit purposes
    // - Send alerts for critical errors
    this.handleCriticalErrors(error)
  }

  private static getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
      default:
        return 'info'
    }
  }

  private static handleCriticalErrors(error: StructuredError): void {
    if (error.severity === ErrorSeverity.CRITICAL) {
      // In production, you would:
      // - Send immediate alerts to administrators
      // - Trigger incident response procedures
      // - Log to high-priority monitoring systems
      console.error('🚨 CRITICAL ERROR DETECTED:', error.message)
    }
  }
}

// Global error handler function
export function handleAPIError(
  error: unknown,
  requestId?: string,
  userId?: string,
  lawFirmId?: string
): NextResponse {
  let structuredError: StructuredError

  if (error instanceof APIError) {
    // Handle custom API errors
    structuredError = {
      type: error.type,
      message: error.message,
      details: error.details,
      code: error.code,
      statusCode: error.statusCode,
      severity: error.severity,
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      lawFirmId
    }
  } else if (error instanceof Error) {
    // Handle generic JavaScript errors
    structuredError = {
      type: ErrorType.SERVER,
      message: error.message || 'An unexpected error occurred',
      details: { stack: error.stack },
      statusCode: 500,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      lawFirmId
    }
  } else {
    // Handle unknown errors
    structuredError = {
      type: ErrorType.SERVER,
      message: 'An unknown error occurred',
      details: { error: String(error) },
      statusCode: 500,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      lawFirmId
    }
  }

  // Log the error
  ErrorLogger.log(structuredError)

  // Return appropriate response
  const response = {
    error: {
      type: structuredError.type,
      message: structuredError.message,
      ...(structuredError.code && { code: structuredError.code }),
      ...(structuredError.details && process.env.NODE_ENV === 'development' && { details: structuredError.details }),
      timestamp: structuredError.timestamp,
      ...(requestId && { requestId })
    }
  }

  return NextResponse.json(response, { status: structuredError.statusCode })
}

// Error response helpers
export function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number = 500,
  details?: ErrorDetails,
  requestId?: string
): NextResponse {
  const error = new APIError(type, message, statusCode, ErrorSeverity.MEDIUM, details)
  return handleAPIError(error, requestId)
}

export function createValidationErrorResponse(
  message: string,
  details?: ErrorDetails,
  requestId?: string
): NextResponse {
  return createErrorResponse(ErrorType.VALIDATION, message, 400, details, requestId)
}

export function createAuthErrorResponse(
  message: string = 'Authentication required',
  requestId?: string
): NextResponse {
  return createErrorResponse(ErrorType.AUTHENTICATION, message, 401, undefined, requestId)
}

export function createAuthzErrorResponse(
  message: string = 'Insufficient permissions',
  requestId?: string
): NextResponse {
  return createErrorResponse(ErrorType.AUTHORIZATION, message, 403, undefined, requestId)
}

export function createNotFoundErrorResponse(
  message: string = 'Resource not found',
  requestId?: string
): NextResponse {
  return createErrorResponse(ErrorType.NOT_FOUND, message, 404, undefined, requestId)
}

export function createRateLimitErrorResponse(
  message: string = 'Rate limit exceeded',
  details?: ErrorDetails,
  requestId?: string
): NextResponse {
  return createErrorResponse(ErrorType.RATE_LIMIT, message, 429, details, requestId)
}

// Error boundaries for async operations
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: { requestId?: string; userId?: string; lawFirmId?: string }
): Promise<T | NextResponse> {
  try {
    return await operation()
  } catch (error) {
    return handleAPIError(error, context?.requestId, context?.userId, context?.lawFirmId)
  }
}

// Development error helpers
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function sanitizeErrorForProduction(error: Record<string, unknown>): Record<string, unknown> {
  if (isDevelopment()) {
    return error // Show full details in development
  }

  // In production, sanitize sensitive information
  // Remove stack trace and other potentially sensitive data
  const { stack: _stack, ...sanitized } = error
  return sanitized
}