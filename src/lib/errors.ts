/**
 * Custom Error Classes for Claude Trade
 * Provides structured error handling across the application
 */

export class TradeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "TradeError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// Authentication Errors
export class AuthenticationError extends TradeError {
  constructor(message: string = "Authentication required", details?: unknown) {
    super(message, "AUTH_REQUIRED", 401, details);
    this.name = "AuthenticationError";
  }
}

export class InvalidSessionError extends TradeError {
  constructor(message: string = "Invalid or expired session", details?: unknown) {
    super(message, "INVALID_SESSION", 401, details);
    this.name = "InvalidSessionError";
  }
}

// Wallet Errors
export class WalletNotFoundError extends TradeError {
  constructor(message: string = "Wallet not found", details?: unknown) {
    super(message, "WALLET_NOT_FOUND", 404, details);
    this.name = "WalletNotFoundError";
  }
}

export class InsufficientBalanceError extends TradeError {
  constructor(
    required: number,
    available: number,
    token: string = "SOL"
  ) {
    super(
      `Insufficient ${token} balance. Required: ${required}, Available: ${available}`,
      "INSUFFICIENT_BALANCE",
      400,
      { required, available, token }
    );
    this.name = "InsufficientBalanceError";
  }
}

export class InvalidAddressError extends TradeError {
  constructor(address: string) {
    super(
      `Invalid Solana address: ${address}`,
      "INVALID_ADDRESS",
      400,
      { address }
    );
    this.name = "InvalidAddressError";
  }
}

// Transaction Errors
export class TransactionError extends TradeError {
  constructor(
    message: string,
    signature?: string,
    details?: unknown
  ) {
    super(message, "TRANSACTION_ERROR", 500, { signature, ...details as object });
    this.name = "TransactionError";
  }
}

export class TransactionTimeoutError extends TradeError {
  constructor(signature: string) {
    super(
      `Transaction timed out: ${signature}`,
      "TRANSACTION_TIMEOUT",
      504,
      { signature }
    );
    this.name = "TransactionTimeoutError";
  }
}

export class SlippageExceededError extends TradeError {
  constructor(expected: number, actual: number) {
    super(
      `Slippage exceeded. Expected: ${expected}%, Actual: ${actual}%`,
      "SLIPPAGE_EXCEEDED",
      400,
      { expected, actual }
    );
    this.name = "SlippageExceededError";
  }
}

// Rate Limiting Errors
export class RateLimitError extends TradeError {
  constructor(
    message: string = "Rate limit exceeded",
    retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, { retryAfter });
    this.name = "RateLimitError";
  }
}

export class DailyLimitError extends TradeError {
  constructor(limit: number, current: number) {
    super(
      `Daily limit exceeded. Limit: ${limit}, Current: ${current}`,
      "DAILY_LIMIT_EXCEEDED",
      429,
      { limit, current }
    );
    this.name = "DailyLimitError";
  }
}

// API Errors
export class ExternalApiError extends TradeError {
  constructor(
    service: string,
    message: string,
    statusCode: number = 502
  ) {
    super(
      `${service} API error: ${message}`,
      "EXTERNAL_API_ERROR",
      statusCode,
      { service }
    );
    this.name = "ExternalApiError";
  }
}

export class JupiterApiError extends ExternalApiError {
  constructor(message: string) {
    super("Jupiter", message);
    this.name = "JupiterApiError";
  }
}

export class BirdeyeApiError extends ExternalApiError {
  constructor(message: string) {
    super("Birdeye", message);
    this.name = "BirdeyeApiError";
  }
}

export class DexScreenerApiError extends ExternalApiError {
  constructor(message: string) {
    super("DexScreener", message);
    this.name = "DexScreenerApiError";
  }
}

export class PumpFunApiError extends ExternalApiError {
  constructor(message: string) {
    super("Pump.fun", message);
    this.name = "PumpFunApiError";
  }
}

// Validation Errors
export class ValidationError extends TradeError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class TokenNotFoundError extends TradeError {
  constructor(token: string) {
    super(
      `Token not found: ${token}`,
      "TOKEN_NOT_FOUND",
      404,
      { token }
    );
    this.name = "TokenNotFoundError";
  }
}

// Database Errors
export class DatabaseError extends TradeError {
  constructor(message: string = "Database error", details?: unknown) {
    super(message, "DATABASE_ERROR", 500, details);
    this.name = "DatabaseError";
  }
}

// Encryption Errors
export class EncryptionError extends TradeError {
  constructor(message: string = "Encryption error") {
    super(message, "ENCRYPTION_ERROR", 500);
    this.name = "EncryptionError";
  }
}

export class EncryptionKeyMissingError extends TradeError {
  constructor() {
    super(
      "Encryption key not configured",
      "ENCRYPTION_KEY_MISSING",
      500
    );
    this.name = "EncryptionKeyMissingError";
  }
}

/**
 * Helper function to handle errors in API routes
 */
export function handleApiError(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
  details?: unknown;
} {
  if (error instanceof TradeError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    error: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Retry helper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
