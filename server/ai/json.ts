import { AppError } from "../errors.js";
import type {
  EmotionMetadata,
  NarrativeChapter,
  NarrativePath,
  ReflectionCard,
  ReflectiveReply,
  TarotLayer,
  TarotNarrative,
  ZiweiNarrative,
} from "../types/api.js";

type StructuredZiwei = Omit<ZiweiNarrative, "meta">;
type StructuredTarot = Omit<TarotNarrative, "meta">;
type StructuredReply = Omit<ReflectiveReply, "meta">;
type StructuredReflection = Omit<ReflectionCard, "meta">;
type RecordValue = Record<string, unknown>;

const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/命中注定/g, "一种单一叙事"],
  [/注定/g, "似乎倾向于"],
  [/成败/g, "结果"],
  [/大凶/g, "强烈挑战"],
  [/大吉/g, "顺畅感"],
];

export function sanitizeEthicalLanguage<T>(value: T): T {
  if (typeof value === "string") {
    let sanitized: string = value;
    for (const [pattern, replacement] of FORBIDDEN_REPLACEMENTS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeEthicalLanguage(item)) as T;
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeEthicalLanguage(item)]),
    ) as T;
  }
  return value;
}

export function parseJsonObject(raw: string): RecordValue {
  // Some compatible providers wrap JSON despite instructions; remove only the
  // transport wrapper, never attempt an AI "repair" loop.
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? trimmed.slice(firstBrace, lastBrace + 1)
      : trimmed;

  try {
    const parsed: unknown = JSON.parse(candidate);
    return objectValue(parsed, "$");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      502,
      "AGNES_INVALID_JSON",
      "这次叙事没有完整生成，请再试一次。",
    );
  }
}

function objectValue(value: unknown, path: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw schemaError(`${path} must be an object.`);
  }
  return value as RecordValue;
}

function stringValue(record: RecordValue, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw schemaError(`${path}.${key} must be a non-empty string.`);
  }
  return value.trim();
}

function optionalStringValue(
  record: RecordValue,
  key: string,
  path: string,
): string | undefined {
  if (record[key] === undefined) return undefined;
  const value = record[key];
  if (typeof value !== "string") {
    throw schemaError(`${path}.${key} must be a string when provided.`);
  }
  // Some providers serialize an omitted optional field as an empty string.
  // Treat it as omitted; this preserves the schema's optional semantics.
  return value.trim() || undefined;
}

function unitValue(record: RecordValue, key: string, path: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw schemaError(`${path}.${key} must be a number between 0 and 1.`);
  }
  return value;
}

function stringArray(
  record: RecordValue,
  key: string,
  path: string,
  min: number,
  max: number,
): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw schemaError(`${path}.${key} must contain ${min}-${max} strings.`);
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw schemaError(`${path}.${key}[${index}] must be a non-empty string.`);
    }
    return item.trim();
  });
}

function objectArray(
  record: RecordValue,
  key: string,
  path: string,
  min: number,
  max: number,
): RecordValue[] {
  const value = record[key];
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw schemaError(`${path}.${key} must contain ${min}-${max} objects.`);
  }
  return value.map((item, index) => objectValue(item, `${path}.${key}[${index}]`));
}

function emotionValue(record: RecordValue, path: string): EmotionMetadata {
  return {
    conflictIntensity: unitValue(record, "conflictIntensity", path),
    pace: unitValue(record, "pace", path),
    luminance: unitValue(record, "luminance", path),
    tone: stringValue(record, "tone", path),
    imageryTags: stringArray(record, "imageryTags", path, 3, 6),
  };
}

function chapterValue(record: RecordValue, path: string): NarrativeChapter {
  return {
    id: stringValue(record, "id", path),
    phase: stringValue(record, "phase", path),
    heading: stringValue(record, "heading", path),
    narrative: stringValue(record, "narrative", path),
    focus: stringValue(record, "focus", path),
    choicePrompt: stringValue(record, "choicePrompt", path),
    intensity: unitValue(record, "intensity", path),
  };
}

function pathValue(
  record: RecordValue,
  path: string,
  expectedId: "flow" | "turn",
): NarrativePath {
  if (record.id !== expectedId) {
    throw schemaError(`${path}.id must be "${expectedId}".`);
  }
  return {
    id: expectedId,
    title: stringValue(record, "title", path),
    subtitle: stringValue(record, "subtitle", path),
    thesis: stringValue(record, "thesis", path),
    chapters: objectArray(record, "chapters", path, 3, 3).map((chapter, index) =>
      chapterValue(chapter, `${path}.chapters[${index}]`),
    ),
  };
}

export function validateZiweiNarrative(value: unknown): StructuredZiwei {
  const record = objectValue(value, "$");
  const paths = objectValue(record.paths, "$.paths");
  const result: StructuredZiwei = {
    title: stringValue(record, "title", "$"),
    summary: stringValue(record, "summary", "$"),
    paths: {
      flow: pathValue(objectValue(paths.flow, "$.paths.flow"), "$.paths.flow", "flow"),
      turn: pathValue(objectValue(paths.turn, "$.paths.turn"), "$.paths.turn", "turn"),
    },
    emotion: emotionValue(objectValue(record.emotion, "$.emotion"), "$.emotion"),
    reflectionQuestions: stringArray(record, "reflectionQuestions", "$", 3, 3),
    imageDirection: stringValue(record, "imageDirection", "$"),
    disclaimer: stringValue(record, "disclaimer", "$"),
  };
  return sanitizeEthicalLanguage(result);
}

function tarotLayerValue(
  record: RecordValue,
  path: string,
  expectedId: TarotLayer["id"],
): TarotLayer {
  if (record.id !== expectedId) {
    throw schemaError(`${path}.id must be "${expectedId}".`);
  }
  return {
    id: expectedId,
    heading: stringValue(record, "heading", path),
    cardReference: stringValue(record, "cardReference", path),
    narrative: stringValue(record, "narrative", path),
    gentlePrompt: stringValue(record, "gentlePrompt", path),
    intensity: unitValue(record, "intensity", path),
  };
}

export function validateTarotNarrative(value: unknown): StructuredTarot {
  const record = objectValue(value, "$");
  const layerIds: TarotLayer["id"][] = [
    "situation",
    "inner-block",
    "possibilities",
  ];
  const layers = objectArray(record, "layers", "$", 3, 3).map((layer, index) =>
    tarotLayerValue(layer, `$.layers[${index}]`, layerIds[index]),
  );

  const result: StructuredTarot = {
    title: stringValue(record, "title", "$"),
    mirror: stringValue(record, "mirror", "$"),
    layers,
    possibilities: stringArray(record, "possibilities", "$", 2, 4),
    grounding: stringValue(record, "grounding", "$"),
    emotion: emotionValue(objectValue(record.emotion, "$.emotion"), "$.emotion"),
    reflectionQuestions: stringArray(record, "reflectionQuestions", "$", 3, 3),
    imageDirection: stringValue(record, "imageDirection", "$"),
    disclaimer: stringValue(record, "disclaimer", "$"),
  };
  return sanitizeEthicalLanguage(result);
}

export function validateReflectiveReply(value: unknown): StructuredReply {
  const record = objectValue(value, "$");
  const safetyNote = optionalStringValue(record, "safetyNote", "$");
  const result: StructuredReply = {
    reply: stringValue(record, "reply", "$"),
    observations: stringArray(record, "observations", "$", 1, 4),
    questions: stringArray(record, "questions", "$", 1, 3),
    emotion: emotionValue(objectValue(record.emotion, "$.emotion"), "$.emotion"),
    ...(safetyNote ? { safetyNote } : {}),
  };
  return sanitizeEthicalLanguage(result);
}

export function validateReflectionCard(value: unknown): StructuredReflection {
  const record = objectValue(value, "$");
  const result: StructuredReflection = {
    eyebrow: stringValue(record, "eyebrow", "$"),
    title: stringValue(record, "title", "$"),
    insight: stringValue(record, "insight", "$"),
    choices: stringArray(record, "choices", "$", 2, 3),
    nextStep: stringValue(record, "nextStep", "$"),
    quote: stringValue(record, "quote", "$"),
    imageryTags: stringArray(record, "imageryTags", "$", 3, 6),
    disclaimer: stringValue(record, "disclaimer", "$"),
  };
  return sanitizeEthicalLanguage(result);
}

function schemaError(message: string): AppError {
  return new AppError(
    502,
    "AGNES_SCHEMA_MISMATCH",
    "这次叙事没有完整生成，请再试一次。",
    { reason: message },
  );
}
