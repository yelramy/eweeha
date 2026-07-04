type LogLevel = 'info' | 'warn' | 'error'

export function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}) {
  try {
    const { route = '', method = '', requestId = '', ...rest } = meta
    const payload = {
      level,
      message,
      route,
      method,
      requestId,
      timestamp: new Date().toISOString(),
      ...rest
    }
    console[level](JSON.stringify(payload))
  } catch {
    // Fallback on serialization issues
    console.log(level.toUpperCase(), message, meta)
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
}


