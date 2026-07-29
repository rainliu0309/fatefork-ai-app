/**
 * Shared server-side API contracts.
 *
 * The browser may mirror these interfaces, but the server remains the source of
 * truth for rule-engine output. Birth data is accepted for one request only and
 * is never persisted by this application.
 */

export type SupportedLocale = "zh-CN" | "en";

export interface BirthInput {
  birthDate: string;
  birthTime: string;
  timezone: string;
  place?: string;
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  display: string;
  yearStem: string;
  yearBranch: string;
}

export interface NormalizedBirth {
  localDate: string;
  localTime: string;
  timezone: string;
  offsetMinutes: number;
  utcInstant: string;
  place?: string;
}

export interface MajorStarPlacement {
  id: string;
  nameZh: string;
  nameEn: string;
  system: "ziwei" | "tianfu";
  /** A plain-language trace showing how the deterministic placement was found. */
  placementRule: string;
}

export interface ZiweiPalace {
  branchIndex: number;
  branch: string;
  /** Client-facing alias retained for the chart grid. */
  earthlyBranch: string;
  heavenlyStem: string;
  name: string;
  nameEn: string;
  isLifePalace: boolean;
  isBodyPalace: boolean;
  majorStars: string[];
  majorStarDetails: MajorStarPlacement[];
  minorStars: string[];
  lifeStage: string;
}

export interface ZiweiChart {
  chartId: string;
  engineVersion: string;
  birth: NormalizedBirth;
  calendar: {
    solar: string;
    lunar: LunarDate;
    hourBranch: string;
    hourBranchIndex: number;
    localDateTime: string;
    utcDateTime: string;
    timezone: string;
    lunarLabel: string;
  };
  bureau: {
    element: "水" | "木" | "金" | "土" | "火";
    number: 2 | 3 | 4 | 5 | 6;
    label: string;
    lifePalaceStem: string;
    nayin: string;
  };
  lifePalaceBranch: string;
  bodyPalaceBranch: string;
  profile: {
    lifePalaceBranch: string;
    bodyPalaceBranch: string;
    fiveElementBureau: string;
    polarity: "阴" | "阳";
  };
  palaces: ZiweiPalace[];
  engine: {
    version: string;
    method: string;
    disclaimer: string;
  };
  /**
   * Calculation notes are deliberately returned so the UI can communicate
   * that symbols came from code rules rather than from the language model.
   */
  explanation: string[];
}

export type TarotOrientation = "upright" | "reversed";

export interface TarotCard {
  id: string;
  nameZh: string;
  nameEn: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  rank?: number;
  keywords: string[];
}

export interface DrawnTarotCard extends TarotCard {
  name: string;
  number?: number;
  orientation: TarotOrientation;
  position: "situation" | "innerBlock" | "possibility";
  positionLabel: string;
  positionDetail: {
    id: "situation" | "inner-block" | "possibilities";
    nameZh: string;
    nameEn: string;
    prompt: string;
  };
}

export interface TarotDraw {
  drawId: string;
  spreadId: string;
  engineVersion: string;
  spread: "three-mirror";
  cards: DrawnTarotCard[];
  drawnAt: string;
  randomSource: "node:crypto.randomInt + Fisher-Yates";
  algorithm: "crypto Fisher-Yates";
}

export interface EmotionMetadata {
  conflictIntensity: number;
  pace: number;
  luminance: number;
  tone: string;
  imageryTags: string[];
}

export interface NarrativeChapter {
  id: string;
  phase: string;
  heading: string;
  narrative: string;
  focus: string;
  choicePrompt: string;
  intensity: number;
}

export interface NarrativePath {
  id: "flow" | "turn";
  title: string;
  subtitle: string;
  thesis: string;
  chapters: NarrativeChapter[];
}

export interface ZiweiNarrative {
  title: string;
  summary: string;
  paths: {
    flow: NarrativePath;
    turn: NarrativePath;
  };
  emotion: EmotionMetadata;
  reflectionQuestions: string[];
  imageDirection: string;
  disclaimer: string;
  meta: GenerationMeta;
  /** Compatibility projection consumed by the portfolio UI. */
  opening?: string;
  alignedPath?: NarrativeSection[];
  turningPath?: NarrativeSection[];
  sharedReflection?: string;
  emotionMeta?: ClientEmotionMetadata;
}

export interface NarrativeSection {
  title: string;
  body: string;
  phase?: string;
  reflection?: string;
}

export interface ClientEmotionMetadata {
  conflictIntensity: number;
  clarity: number;
  emotionalTone: string;
  imageryTags: string[];
  tempo: "slow" | "steady" | "flowing";
}

export interface TarotLayer {
  id: "situation" | "inner-block" | "possibilities";
  heading: string;
  cardReference: string;
  narrative: string;
  gentlePrompt: string;
  intensity: number;
}

export interface TarotNarrative {
  title: string;
  mirror: string;
  layers: TarotLayer[];
  /** Provider-native parallel perspectives, retained for history/debugging. */
  perspectives?: string[];
  /** Compatibility sections consumed by the portfolio UI. */
  possibilities: Array<string | NarrativeSection>;
  grounding: string;
  emotion: EmotionMetadata;
  reflectionQuestions: string[];
  imageDirection: string;
  disclaimer: string;
  meta: GenerationMeta;
  situation?: NarrativeSection;
  innerBlock?: NarrativeSection;
  gentleAction?: string;
  followupPrompts?: string[];
  emotionMeta?: ClientEmotionMetadata;
}

export interface ReflectiveReply {
  reply: string;
  observations: string[];
  questions: string[];
  emotion: EmotionMetadata;
  safetyNote?: string;
  reflectionPrompt?: string;
  meta: GenerationMeta;
}

export interface ReflectionCard {
  eyebrow: string;
  title: string;
  insight: string;
  choices: string[];
  nextStep: string;
  quote: string;
  imageryTags: string[];
  disclaimer: string;
  meta: GenerationMeta;
  subtitle?: string;
  closing?: string;
  createdAt?: string;
}

export interface GenerationMeta {
  provider: "agnes" | "mock";
  model: string;
  schemaVersion: string;
}

export interface GeneratedImage {
  url: string;
  mimeType: string;
  prompt: string;
  provider: "agnes" | "mock";
  model: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  mock?: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
}
