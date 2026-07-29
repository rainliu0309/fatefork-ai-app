import "dotenv/config";

/**
 * Runtime configuration with conservative defaults suitable for local
 * development and Render. `dotenv/config` also keeps local `.env` loading
 * compatible with the project's minimum Node 20 runtime.
 */

function integerEnv(name: string, fallback: number, min: number, max: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: integerEnv("PORT", 8787, 1, 65_535),
  clientOrigin:
    process.env.CLIENT_ORIGIN ??
    "http://localhost:5173,http://127.0.0.1:5173",
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? "12mb",
  apiRateLimitPerMinute: integerEnv("API_RATE_LIMIT_PER_MINUTE", 90, 1, 10_000),
  agnes: {
    apiKey: process.env.AGNES_API_KEY?.trim() ?? "",
    baseUrl: normalizeBaseUrl(
      process.env.AGNES_BASE_URL ?? "https://apihub.agnes-ai.com/v1",
    ),
    textModel: process.env.AGNES_TEXT_MODEL ?? "agnes-2.0-flash",
    imageModel: process.env.AGNES_IMAGE_MODEL ?? "agnes-image-2.1-flash",
    timeoutMs: integerEnv("AGNES_TIMEOUT_MS", 45_000, 1_000, 180_000),
    imageTimeoutMs: integerEnv("AGNES_IMAGE_TIMEOUT_MS", 90_000, 1_000, 300_000),
    maxRequestsPerMinute: integerEnv(
      "AGNES_MAX_REQUESTS_PER_MINUTE",
      30,
      1,
      10_000,
    ),
  },
} as const;

export const isAgnesConfigured = config.agnes.apiKey.length > 0;
