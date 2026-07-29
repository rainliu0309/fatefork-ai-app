export type Tempo = "slow" | "steady" | "flowing";

export interface EmotionMeta {
  conflictIntensity: number;
  clarity: number;
  emotionalTone: string;
  imageryTags: string[];
  tempo: Tempo;
}

export interface ZiweiPalace {
  name: string;
  earthlyBranch: string;
  majorStars: string[];
  minorStars: string[];
  lifeStage: string;
}

export interface ZiweiChart {
  chartId: string;
  calendar: {
    localDateTime: string;
    utcDateTime: string;
    timezone: string;
    lunarLabel?: string;
  };
  profile: {
    lifePalaceBranch: string;
    bodyPalaceBranch: string;
    fiveElementBureau: string;
    polarity: string;
  };
  palaces: ZiweiPalace[];
  engine?: {
    version: string;
    method: string;
    disclaimer: string;
  };
}

export interface NarrativeSection {
  title: string;
  body: string;
  phase?: string;
  reflection?: string;
}

export interface ZiweiNarrative {
  title: string;
  opening: string;
  alignedPath: NarrativeSection[];
  turningPath: NarrativeSection[];
  sharedReflection: string;
  reflectionQuestions: string[];
  emotionMeta: EmotionMeta;
  disclaimer: string;
  generatedBy?: string;
  meta?: GenerationMeta;
}

export interface TarotCard {
  id: string;
  name: string;
  nameEn: string;
  arcana: "major" | "minor";
  suit?: string;
  number?: number;
  orientation: "upright" | "reversed";
  position: "situation" | "innerBlock" | "possibility";
  positionLabel: string;
  keywords: string[];
}

export interface TarotSpread {
  spreadId: string;
  drawnAt: string;
  algorithm: string;
  cards: TarotCard[];
}

/** Concealed selection metadata; card identities remain server-side. */
export interface TarotSelfDrawSession {
  sessionId: string;
  slotCount: number;
  requiredSelections: number;
  expiresAt: string;
}

export interface TarotSelfDrawPickResult {
  sessionId: string;
  selectedSlots: number[];
  requiredSelections: number;
  complete: boolean;
  draw?: TarotSpread;
}

export interface TarotNarrative {
  title: string;
  grounding: string;
  situation: NarrativeSection;
  innerBlock: NarrativeSection;
  possibilities: NarrativeSection[];
  gentleAction: string;
  followupPrompts: string[];
  reflectionChoices?: string[][];
  emotionMeta: EmotionMeta;
  disclaimer: string;
  generatedBy?: string;
  meta?: GenerationMeta;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface GenerationMeta {
  provider: "agnes" | "mock";
  model: string;
  schemaVersion: string;
}

export interface ReflectiveReply {
  reply: string;
  reflectionPrompt?: string;
  observations?: string[];
  questions?: string[];
  safetyNote?: string;
  meta?: GenerationMeta;
}

export interface ReflectionCardData {
  title: string;
  subtitle: string;
  insight: string;
  choices: string[];
  /** A small, user-controlled action to carry out after the reflection. */
  nextStep: string;
  closing: string;
  imageryTags: string[];
  createdAt: string;
  meta?: GenerationMeta;
}

export type HistoryKind = "ziwei" | "tarot" | "chat";

export interface HistoryRecord {
  id: string;
  kind: HistoryKind;
  title: string;
  summary: string;
  createdAt: string;
  payload: unknown;
  reflection?: ReflectionCardData;
  realityNotes?: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
}
