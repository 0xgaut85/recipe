/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

interface EnvConfig {
  // Required
  DATABASE_URL: string;
  ENCRYPTION_KEY: string;

  // Optional with defaults
  NEXT_PUBLIC_RPC_URL: string;
  HELIUS_API_KEY?: string;
  BIRDEYE_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;

  // Withdrawal settings
  MIN_WITHDRAWAL_SOL: number;
  WITHDRAWAL_FEE_SOL: number;
  MAX_DAILY_WITHDRAWALS: number;

  // Runtime
  NODE_ENV: "development" | "production" | "test";
}

interface ValidationError {
  variable: string;
  message: string;
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(
  name: string,
  value: string | undefined,
  options: {
    required?: boolean;
    minLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): ValidationError | null {
  const { required = true, minLength, pattern, patternMessage } = options;

  if (required && !value) {
    return { variable: name, message: `${name} is required but not set` };
  }

  if (value && minLength && value.length < minLength) {
    return {
      variable: name,
      message: `${name} must be at least ${minLength} characters`,
    };
  }

  if (value && pattern && !pattern.test(value)) {
    return {
      variable: name,
      message: patternMessage || `${name} has invalid format`,
    };
  }

  return null;
}

/**
 * Validate all required environment variables
 * Call this at application startup
 */
export function validateEnvironment(): {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
} {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // DATABASE_URL - Required
  const dbError = validateEnvVar("DATABASE_URL", process.env.DATABASE_URL, {
    required: true,
    pattern: /^postgres(ql)?:\/\//,
    patternMessage: "DATABASE_URL must be a valid PostgreSQL connection string",
  });
  if (dbError) errors.push(dbError);

  // ENCRYPTION_KEY - Required, must be 64 hex characters (32 bytes)
  const encKeyError = validateEnvVar(
    "ENCRYPTION_KEY",
    process.env.ENCRYPTION_KEY,
    {
      required: true,
      minLength: 64,
      pattern: /^[0-9a-fA-F]{64}$/,
      patternMessage:
        "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
    }
  );
  if (encKeyError) errors.push(encKeyError);

  // NEXT_PUBLIC_RPC_URL - Required for Solana operations
  const rpcError = validateEnvVar(
    "NEXT_PUBLIC_RPC_URL",
    process.env.NEXT_PUBLIC_RPC_URL,
    {
      required: true,
      pattern: /^https?:\/\//,
      patternMessage: "NEXT_PUBLIC_RPC_URL must be a valid URL",
    }
  );
  if (rpcError) errors.push(rpcError);

  // Optional API keys - warn if not set
  if (!process.env.HELIUS_API_KEY) {
    warnings.push(
      "HELIUS_API_KEY not set - some wallet features may be limited"
    );
  }

  if (!process.env.BIRDEYE_API_KEY) {
    warnings.push(
      "BIRDEYE_API_KEY not set - OHLCV and technical indicators unavailable"
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push(
      "ANTHROPIC_API_KEY not set - AI chat features will be disabled"
    );
  }

  // Validate numeric environment variables
  const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_SOL || "0.01");
  if (isNaN(minWithdrawal) || minWithdrawal <= 0) {
    errors.push({
      variable: "MIN_WITHDRAWAL_SOL",
      message: "MIN_WITHDRAWAL_SOL must be a positive number",
    });
  }

  const withdrawalFee = parseFloat(process.env.WITHDRAWAL_FEE_SOL || "0.001");
  if (isNaN(withdrawalFee) || withdrawalFee < 0) {
    errors.push({
      variable: "WITHDRAWAL_FEE_SOL",
      message: "WITHDRAWAL_FEE_SOL must be a non-negative number",
    });
  }

  const maxDailyWithdrawals = parseInt(
    process.env.MAX_DAILY_WITHDRAWALS || "10",
    10
  );
  if (isNaN(maxDailyWithdrawals) || maxDailyWithdrawals < 1) {
    errors.push({
      variable: "MAX_DAILY_WITHDRAWALS",
      message: "MAX_DAILY_WITHDRAWALS must be a positive integer",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment config
 * Throws if validation fails
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnvironment();

  if (!validation.valid) {
    const errorMessages = validation.errors
      .map((e) => `  - ${e.message}`)
      .join("\n");
    throw new Error(
      `Environment validation failed:\n${errorMessages}\n\nPlease check your .env file or environment variables.`
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
    NEXT_PUBLIC_RPC_URL:
      process.env.NEXT_PUBLIC_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    MIN_WITHDRAWAL_SOL: parseFloat(process.env.MIN_WITHDRAWAL_SOL || "0.01"),
    WITHDRAWAL_FEE_SOL: parseFloat(process.env.WITHDRAWAL_FEE_SOL || "0.001"),
    MAX_DAILY_WITHDRAWALS: parseInt(
      process.env.MAX_DAILY_WITHDRAWALS || "10",
      10
    ),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  };
}

/**
 * Log environment validation results
 * Call at startup to see warnings
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();

  if (!validation.valid) {
    console.error("❌ Environment validation FAILED:");
    validation.errors.forEach((e) => {
      console.error(`   - ${e.variable}: ${e.message}`);
    });
  } else {
    console.log("✅ Environment validation passed");
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    validation.warnings.forEach((w) => {
      console.warn(`   - ${w}`);
    });
  }
}
