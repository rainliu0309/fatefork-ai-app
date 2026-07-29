import { badRequest } from "../errors.js";
import type {
  BirthInput,
  ConversationTurn,
  SupportedLocale,
} from "../types/api.js";

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown, label = "request body"): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw badRequest(`${label} must be a JSON object.`);
  }
  return value as UnknownRecord;
}

export function requiredString(
  record: UnknownRecord,
  key: string,
  options: { min?: number; max?: number } = {},
): string {
  const min = options.min ?? 1;
  const max = options.max ?? 8_000;
  const value = record[key];
  if (typeof value !== "string") {
    throw badRequest(`"${key}" must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw badRequest(`"${key}" must contain ${min}-${max} characters.`);
  }
  return trimmed;
}

export function optionalString(
  record: UnknownRecord,
  key: string,
  max = 8_000,
): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.trim().length > max) {
    throw badRequest(`"${key}" must be a string no longer than ${max} characters.`);
  }
  return value.trim();
}

export function parseLocale(value: unknown): SupportedLocale {
  if (value === undefined || value === null || value === "zh-CN") return "zh-CN";
  if (value === "en") return "en";
  throw badRequest('"locale" must be "zh-CN" or "en".');
}

export function parseBirthInput(value: unknown): BirthInput {
  const record = asRecord(value, "birth");
  const birthDate = requiredString(record, "birthDate", { max: 10 });
  const birthTime = requiredString(record, "birthTime", { max: 5 });
  const timezone = requiredString(record, "timezone", { max: 64 });
  const place =
    optionalString(record, "place", 120) ??
    optionalString(record, "birthplace", 120);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw badRequest('"birthDate" must use YYYY-MM-DD.');
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
    throw badRequest('"birthTime" must use 24-hour HH:mm.');
  }

  return { birthDate, birthTime, timezone, ...(place ? { place } : {}) };
}

export function parseConversationHistory(value: unknown): ConversationTurn[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 12) {
    throw badRequest('"history" must be an array with no more than 12 turns.');
  }

  return value.map((turn, index) => {
    const item = asRecord(turn, `history[${index}]`);
    if (item.role !== "user" && item.role !== "assistant") {
      throw badRequest(`history[${index}].role must be "user" or "assistant".`);
    }
    const content = requiredString(item, "content", { max: 4_000 });
    return { role: item.role, content };
  });
}

/**
 * The Agnes vision endpoint accepts public URLs. Data URLs are also accepted by
 * this app for provider variants that support them; MIME and approximate byte
 * size are constrained before anything leaves the server.
 */
export function parseMoodImage(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as UnknownRecord;
    const data = record.data;
    if (typeof data !== "string") {
      throw badRequest('"moodImage.data" must be an image data URL.');
    }
    const declaredMime = record.mimeType;
    if (
      declaredMime !== undefined &&
      (typeof declaredMime !== "string" ||
        !/^image\/(?:jpeg|png|webp)$/i.test(declaredMime))
    ) {
      throw badRequest('"moodImage.mimeType" must be image/jpeg, image/png, or image/webp.');
    }
    return parseMoodImage(data);
  }
  if (typeof value !== "string") {
    throw badRequest('"moodImage" must be an HTTPS URL or an image data URL.');
  }

  if (/^https:\/\/[^\s]+$/i.test(value)) return value;

  const match = value.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i,
  );
  if (!match) {
    throw badRequest(
      '"moodImage" supports HTTPS or base64 image/jpeg, image/png, and image/webp.',
    );
  }

  const estimatedBytes = Math.floor((match[2].replace(/\s/g, "").length * 3) / 4);
  if (estimatedBytes > 8 * 1024 * 1024) {
    throw badRequest('"moodImage" must be 8 MB or smaller.');
  }
  return value;
}

export function parseStringArray(
  value: unknown,
  label: string,
  limits: { min?: number; max?: number; itemMax?: number } = {},
): string[] {
  const min = limits.min ?? 0;
  const max = limits.max ?? 12;
  const itemMax = limits.itemMax ?? 80;
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw badRequest(`"${label}" must contain ${min}-${max} items.`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim() || item.trim().length > itemMax) {
      throw badRequest(`${label}[${index}] must be a short non-empty string.`);
    }
    return item.trim();
  });
}
