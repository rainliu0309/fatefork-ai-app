/**
 * JSON Schemas are sent with each structured Agnes request and are also
 * enforced again by local validators. The dual boundary protects the UI from
 * malformed or prompt-injected model output.
 */

const stringSchema = { type: "string", minLength: 1 } as const;
const unitNumberSchema = { type: "number", minimum: 0, maximum: 1 } as const;

const emotionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["conflictIntensity", "pace", "luminance", "tone", "imageryTags"],
  properties: {
    conflictIntensity: unitNumberSchema,
    pace: unitNumberSchema,
    luminance: unitNumberSchema,
    tone: stringSchema,
    imageryTags: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: stringSchema,
    },
  },
} as const;

const chapterSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "phase",
    "heading",
    "narrative",
    "focus",
    "choicePrompt",
    "intensity",
  ],
  properties: {
    id: stringSchema,
    phase: stringSchema,
    heading: stringSchema,
    narrative: stringSchema,
    focus: stringSchema,
    choicePrompt: stringSchema,
    intensity: unitNumberSchema,
  },
} as const;

const pathSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "subtitle", "thesis", "chapters"],
  properties: {
    id: { type: "string", enum: ["flow", "turn"] },
    title: stringSchema,
    subtitle: stringSchema,
    thesis: stringSchema,
    chapters: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: chapterSchema,
    },
  },
} as const;

export const ZIWEI_NARRATIVE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "paths",
    "emotion",
    "reflectionQuestions",
    "imageDirection",
    "disclaimer",
  ],
  properties: {
    title: stringSchema,
    summary: stringSchema,
    paths: {
      type: "object",
      additionalProperties: false,
      required: ["flow", "turn"],
      properties: { flow: pathSchema, turn: pathSchema },
    },
    emotion: emotionSchema,
    reflectionQuestions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: stringSchema,
    },
    imageDirection: stringSchema,
    disclaimer: stringSchema,
  },
} as const;

const tarotLayerSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "heading",
    "cardReference",
    "narrative",
    "gentlePrompt",
    "intensity",
  ],
  properties: {
    id: {
      type: "string",
      enum: ["situation", "inner-block", "possibilities"],
    },
    heading: stringSchema,
    cardReference: stringSchema,
    narrative: stringSchema,
    gentlePrompt: stringSchema,
    intensity: unitNumberSchema,
  },
} as const;

export const TAROT_NARRATIVE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "mirror",
    "layers",
    "possibilities",
    "grounding",
    "emotion",
    "reflectionQuestions",
    "imageDirection",
    "disclaimer",
  ],
  properties: {
    title: stringSchema,
    mirror: stringSchema,
    layers: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: tarotLayerSchema,
    },
    possibilities: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: stringSchema,
    },
    grounding: stringSchema,
    emotion: emotionSchema,
    reflectionQuestions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: stringSchema,
    },
    imageDirection: stringSchema,
    disclaimer: stringSchema,
  },
} as const;

export const REFLECTIVE_REPLY_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["reply", "observations", "questions", "emotion"],
  properties: {
    reply: stringSchema,
    observations: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: stringSchema,
    },
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: stringSchema,
    },
    emotion: emotionSchema,
    safetyNote: { type: "string" },
  },
} as const;

export const REFLECTION_CARD_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "eyebrow",
    "title",
    "insight",
    "choices",
    "nextStep",
    "quote",
    "imageryTags",
    "disclaimer",
  ],
  properties: {
    eyebrow: stringSchema,
    title: stringSchema,
    insight: stringSchema,
    choices: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: stringSchema,
    },
    nextStep: stringSchema,
    quote: stringSchema,
    imageryTags: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: stringSchema,
    },
    disclaimer: stringSchema,
  },
} as const;

export type JsonSchema = Record<string, unknown>;
