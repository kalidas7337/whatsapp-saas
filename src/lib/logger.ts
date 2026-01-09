/**
 * Structured Logger for Production
 *
 * Provides consistent, JSON-formatted logging with context
 * Compatible with log aggregators like DataDog, CloudWatch, etc.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  environment: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const SERVICE_NAME = process.env.SERVICE_NAME || 'whatsapp-saas'
const ENVIRONMENT = process.env.NODE_ENV || 'development'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel
const JSON_LOGGING = process.env.JSON_LOGGING === 'true' || ENVIRONMENT === 'production'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]
}

function formatError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
  }
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  if (error) {
    entry.error = formatError(error)
  }

  return entry
}

function output(level: LogLevel, entry: LogEntry): void {
  const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

  if (JSON_LOGGING) {
    logFn(JSON.stringify(entry))
  } else {
    // Human-readable format for development
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}` : ''
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
    logFn(`${prefix} ${entry.message}${contextStr}${errorStr}`)
  }
}

/**
 * Main logger object
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    output('debug', createLogEntry('debug', message, context))
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    output('info', createLogEntry('info', message, context))
  },

  warn(message: string, context?: LogContext, error?: unknown): void {
    if (!shouldLog('warn')) return
    output('warn', createLogEntry('warn', message, context, error))
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    if (!shouldLog('error')) return
    output('error', createLogEntry('error', message, context, error))
  },

  /**
   * Create a child logger with preset context
   */
  child(baseContext: LogContext) {
    const childLogger = {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext, error?: unknown) =>
        logger.warn(message, { ...baseContext, ...context }, error),
      error: (message: string, error?: unknown, context?: LogContext) =>
        logger.error(message, error, { ...baseContext, ...context }),
      child: (additionalContext: LogContext) =>
        logger.child({ ...baseContext, ...additionalContext }),
    }
    return childLogger
  },
}

/**
 * Request logger middleware context
 */
export function createRequestLogger(requestId: string, path: string, method: string) {
  return logger.child({
    requestId,
    path,
    method,
  })
}

/**
 * API request timing helper
 */
export function logApiRequest(
  log: ReturnType<typeof createRequestLogger>,
  statusCode: number,
  durationMs: number,
  context?: LogContext
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
  const message = `API Request completed`

  log[level](message, {
    statusCode,
    durationMs,
    ...context,
  })
}

export default logger
