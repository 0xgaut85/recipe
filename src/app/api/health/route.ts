import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/prisma";
import { verifyEncryptionKey } from "@/lib/encryption";
import { validateEnvironment } from "@/lib/env";

/**
 * GET /api/health
 * Health check endpoint for Railway and monitoring
 * Returns detailed health status of all system components
 */
export async function GET() {
  const checks: Record<
    string,
    { status: "ok" | "error" | "warn"; message?: string; latencyMs?: number }
  > = {};

  // Check environment variables
  const envValidation = validateEnvironment();
  if (envValidation.valid) {
    checks.environment = { status: "ok" };
  } else {
    checks.environment = {
      status: "error",
      message: envValidation.errors.map((e) => e.message).join("; "),
    };
  }

  // Add warnings for optional env vars
  if (envValidation.warnings.length > 0) {
    checks.optional_config = {
      status: "warn",
      message: envValidation.warnings.join("; "),
    };
  } else {
    checks.optional_config = { status: "ok" };
  }

  // Check database connection with latency
  const dbCheck = await checkDatabaseConnection();
  if (dbCheck.connected) {
    checks.database = {
      status: "ok",
      latencyMs: dbCheck.latencyMs,
    };
  } else {
    checks.database = {
      status: "error",
      message: dbCheck.error || "Database connection failed",
      latencyMs: dbCheck.latencyMs,
    };
  }

  // Check encryption key
  try {
    const isValid = verifyEncryptionKey();
    checks.encryption = isValid
      ? { status: "ok" }
      : { status: "error", message: "Encryption key invalid or not configured" };
  } catch (error) {
    checks.encryption = {
      status: "error",
      message: error instanceof Error ? error.message : "Encryption check failed",
    };
  }

  // Check Solana RPC connectivity
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (rpcUrl) {
    try {
      const rpcStart = Date.now();
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getHealth",
        }),
        signal: AbortSignal.timeout(5000),
      });
      const rpcLatency = Date.now() - rpcStart;

      if (rpcResponse.ok) {
        checks.solana_rpc = { status: "ok", latencyMs: rpcLatency };
      } else {
        checks.solana_rpc = {
          status: "error",
          message: `RPC returned ${rpcResponse.status}`,
          latencyMs: rpcLatency,
        };
      }
    } catch (error) {
      checks.solana_rpc = {
        status: "error",
        message: error instanceof Error ? error.message : "RPC check failed",
      };
    }
  } else {
    checks.solana_rpc = {
      status: "warn",
      message: "NEXT_PUBLIC_RPC_URL not configured",
    };
  }

  // Check Claude API (if configured)
  if (process.env.ANTHROPIC_API_KEY) {
    checks.claude_api = { status: "ok" };
  } else {
    checks.claude_api = {
      status: "warn",
      message: "ANTHROPIC_API_KEY not configured",
    };
  }

  // Overall status determination
  const hasErrors = Object.values(checks).some((c) => c.status === "error");
  const hasWarnings = Object.values(checks).some((c) => c.status === "warn");
  const overallStatus = hasErrors
    ? "unhealthy"
    : hasWarnings
    ? "degraded"
    : "healthy";

  // Calculate total latency
  const totalLatency = Object.values(checks)
    .filter((c) => c.latencyMs)
    .reduce((sum, c) => sum + (c.latencyMs || 0), 0);

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      totalLatencyMs: totalLatency,
      checks,
    },
    { status: hasErrors ? 503 : 200 }
  );
}
