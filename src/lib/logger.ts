import pino from "pino";

/**
 * Application logger using pino
 * Provides structured logging for better observability
 */

const isDevelopment = process.env.NODE_ENV === "development";

// Create base logger
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  // Use pretty printing in development
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  // Add base fields
  base: {
    service: "recipe-app",
    version: process.env.npm_package_version || "0.1.0",
  },
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "privateKey",
      "encryptedPrivateKey",
      "token",
      "apiKey",
      "secret",
      "authorization",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Pre-configured loggers for different modules
 */
export const loggers = {
  api: createLogger("api"),
  auth: createLogger("auth"),
  wallet: createLogger("wallet"),
  trade: createLogger("trade"),
  chat: createLogger("chat"),
  db: createLogger("database"),
  external: createLogger("external-api"),
};

/**
 * Log an API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  const log = statusCode >= 500 ? loggers.api.error : statusCode >= 400 ? loggers.api.warn : loggers.api.info;
  log({
    method,
    path,
    statusCode,
    durationMs,
    userId,
  }, `${method} ${path} ${statusCode} ${durationMs}ms`);
}

/**
 * Log an external API call
 */
export function logExternalApi(
  service: string,
  endpoint: string,
  statusCode: number,
  durationMs: number,
  error?: string
) {
  if (error) {
    loggers.external.error({ service, endpoint, statusCode, durationMs, error }, `External API error: ${service}`);
  } else {
    loggers.external.info({ service, endpoint, statusCode, durationMs }, `External API call: ${service}`);
  }
}

/**
 * Log a trade execution
 */
export function logTrade(
  type: "spot" | "perp",
  action: "execute" | "quote",
  userId: string,
  details: Record<string, unknown>,
  error?: string
) {
  if (error) {
    loggers.trade.error({ type, action, userId, ...details, error }, `Trade ${action} failed`);
  } else {
    loggers.trade.info({ type, action, userId, ...details }, `Trade ${action} successful`);
  }
}

/**
 * Log a withdrawal
 */
export function logWithdrawal(
  userId: string,
  amount: number,
  destination: string,
  signature?: string,
  error?: string
) {
  if (error) {
    loggers.wallet.error({ userId, amount, destination, error }, "Withdrawal failed");
  } else {
    loggers.wallet.info({ userId, amount, destination, signature }, "Withdrawal successful");
  }
}

/**
 * Log authentication events
 */
export function logAuth(
  event: "login" | "logout" | "session_created" | "session_expired",
  userId?: string,
  details?: Record<string, unknown>
) {
  loggers.auth.info({ event, userId, ...details }, `Auth event: ${event}`);
}

/**
 * Log database operations
 */
export function logDbOperation(
  operation: string,
  table: string,
  durationMs: number,
  error?: string
) {
  if (error) {
    loggers.db.error({ operation, table, durationMs, error }, `Database error: ${operation}`);
  } else if (durationMs > 1000) {
    loggers.db.warn({ operation, table, durationMs }, `Slow query: ${operation}`);
  } else {
    loggers.db.debug({ operation, table, durationMs }, `Database: ${operation}`);
  }
}

export default logger;
