import { randomUUID } from "node:crypto";
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { config } from "../config.js";
import { AppError } from "../errors.js";
import type { ApiFailure, ApiSuccess } from "../types/api.js";

export const asyncHandler = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
};

export const requestContext: RequestHandler = (request, response, next) => {
  const candidate = request.header("x-request-id");
  request.requestId =
    candidate && /^[A-Za-z0-9_-]{8,80}$/.test(candidate)
      ? candidate
      : randomUUID();
  response.setHeader("x-request-id", request.requestId);
  next();
};

export const securityHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

export const cors: RequestHandler = (request, response, next) => {
  const allowed = new Set(
    config.clientOrigin
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const origin = request.header("origin");
  let isSameOrigin = false;
  if (origin) {
    try {
      isSameOrigin = new URL(origin).host === request.get("host");
    } catch {
      isSameOrigin = false;
    }
  }

  if (origin && !isSameOrigin && !allowed.has("*") && !allowed.has(origin)) {
    next(
      new AppError(403, "ORIGIN_NOT_ALLOWED", "This browser origin is not allowed."),
    );
    return;
  }

  if (origin) {
    response.setHeader(
      "Access-Control-Allow-Origin",
      allowed.has("*") ? "*" : origin,
    );
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-ID",
  );

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  next();
};

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

/**
 * A small in-memory edge limiter protects local/portfolio deployments. Agnes
 * has a second provider-specific limiter in its adapter. Multi-instance Render
 * deployments should add a shared gateway limiter if traffic grows.
 */
export const apiRateLimit: RequestHandler = (request, _response, next) => {
  if (request.method === "OPTIONS" || request.path === "/health") {
    next();
    return;
  }

  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const current = buckets.get(key);
  const bucket =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + 60_000 }
      : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  // Bound memory even if a scanner rotates source addresses.
  if (buckets.size > 10_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  if (bucket.count > config.apiRateLimitPerMinute) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000));
    next(
      new AppError(
        429,
        "API_RATE_LIMIT",
        "Too many requests. Please slow down and try again.",
        undefined,
        retryAfter,
      ),
    );
    return;
  }
  next();
};

export function sendData<T>(
  request: Request,
  response: Response,
  data: T,
  options: { status?: number; mock?: boolean } = {},
): void {
  const payload: ApiSuccess<T> = {
    success: true,
    data,
    meta: {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      ...(options.mock === undefined ? {} : { mock: options.mock }),
    },
  };
  response.status(options.status ?? 200).json(payload);
}

export const notFound: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      404,
      "ROUTE_NOT_FOUND",
      `No API route matches ${request.method} ${request.originalUrl}.`,
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  // Express identifies error middleware by its four-argument signature.
  void _next;
  const isJsonSyntaxError =
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed";
  const isPayloadTooLarge =
    typeof error === "object" &&
    error !== null &&
    (("type" in error && error.type === "entity.too.large") ||
      ("status" in error && error.status === 413));
  const appError = isJsonSyntaxError
    ? new AppError(400, "INVALID_JSON", "The request body is not valid JSON.")
    : isPayloadTooLarge
      ? new AppError(
          413,
          "PAYLOAD_TOO_LARGE",
          `The JSON request exceeds the configured ${config.jsonBodyLimit} limit.`,
        )
      : error instanceof AppError
        ? error
        : new AppError(500, "INTERNAL_ERROR", "An unexpected server error occurred.");

  if (appError.retryAfterSeconds) {
    response.setHeader("Retry-After", String(appError.retryAfterSeconds));
  }

  if (appError.status >= 500) {
    // Do not send stack traces/provider bodies to the browser.
    console.error(
      JSON.stringify({
        level: "error",
        requestId: request.requestId,
        code: appError.code,
        message: error instanceof Error ? error.message : String(error),
        stack: config.nodeEnv === "development" && error instanceof Error
          ? error.stack
          : undefined,
      }),
    );
  }

  const payload: ApiFailure = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.status < 500 && appError.details !== undefined
        ? { details: appError.details }
        : {}),
    },
    meta: {
      requestId: request.requestId || randomUUID(),
      timestamp: new Date().toISOString(),
    },
  };
  response.status(appError.status).json(payload);
};
