import type {
  ChatMessage,
  ReflectionCardData,
  TarotNarrative,
  TarotSpread,
  ReflectiveReply,
  ZiweiChart,
  ZiweiNarrative,
} from "@/types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}

type Envelope<T> = { success?: boolean; data?: T; error?: { code?: string; message?: string } } | T;

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 45_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as Envelope<T>;

    if (!response.ok) {
      const envelope = payload as {
        error?: { code?: string; message?: string };
        message?: string;
      };
      throw new ApiError(
        envelope.error?.message || envelope.message || "暂时无法完成请求，请稍后再试。",
        response.status,
        envelope.error?.code,
      );
    }

    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      (payload as { data?: T }).data !== undefined
    ) {
      return (payload as { data: T }).data;
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("生成时间稍长，本次请求已暂停。你可以再次尝试。", 408, "TIMEOUT");
    }
    throw new ApiError("未能连接到叙事服务，请确认本地后端已启动。", 503, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timer);
  }
}

export const api = {
  health: () => request<{ status: string; agnesConfigured: boolean }>("/health"),

  createZiweiChart: (input: {
    birthDate: string;
    birthTime: string;
    timezone: string;
    birthplace?: string;
  }) =>
    request<ZiweiChart>("/ziwei/chart", {
      method: "POST",
      body: JSON.stringify({
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        timezone: input.timezone,
        place: input.birthplace || undefined,
      }),
    }),

  createZiweiNarrative: (input: {
    chart: ZiweiChart;
    moodImage?: { mimeType: string; data: string };
  }) =>
    request<ZiweiNarrative>("/ziwei/narrative", {
      method: "POST",
      body: JSON.stringify({
        chart: input.chart,
        moodImage: input.moodImage?.data,
      }),
    }),

  drawTarot: (question: string) =>
    request<TarotSpread>("/tarot/draw", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  createTarotNarrative: (question: string, spread: TarotSpread) =>
    request<TarotNarrative>("/tarot/narrative", {
      method: "POST",
      body: JSON.stringify({ question, draw: spread }),
    }),

  tarotFollowup: (
    question: string,
    spread: TarotSpread,
    narrative: TarotNarrative,
    messages: ChatMessage[],
  ) =>
    request<ReflectiveReply>("/tarot/followup", {
      method: "POST",
      body: JSON.stringify({
        question,
        followup:
          [...messages].reverse().find((message) => message.role === "user")
            ?.content || "",
        draw: spread,
        previousNarrative: JSON.stringify(narrative).slice(0, 8_000),
        history: messages
          .slice(0, -1)
          .slice(-12)
          .map(({ role, content }) => ({ role, content })),
      }),
    }),

  chat: (messages: ChatMessage[]) =>
    request<ReflectiveReply>("/chat", {
      method: "POST",
      body: JSON.stringify({
        message:
          [...messages].reverse().find((message) => message.role === "user")
            ?.content || "",
        history: messages
          .slice(0, -1)
          .slice(-12)
          .map(({ role, content }) => ({ role, content })),
      }),
    }),

  reflection: (input: {
    source: "ziwei" | "tarot";
    sourceTitle: string;
    narrative: unknown;
    answers: string[];
    questions?: string[];
  }) =>
    request<ReflectionCardData>("/reflection", {
      method: "POST",
      body: JSON.stringify({
        sourceType: input.source,
        answers: input.answers.map((answer, index) => ({
          question: input.questions?.[index] || `递进式自省问题 ${index + 1}`,
          answer,
        })),
        narrativeSummary: JSON.stringify(input.narrative).slice(0, 4_000),
        imageryTags:
          input.narrative &&
          typeof input.narrative === "object" &&
          "emotionMeta" in input.narrative &&
          Array.isArray(
            (input.narrative as { emotionMeta?: { imageryTags?: unknown } })
              .emotionMeta?.imageryTags,
          )
            ? (
                input.narrative as {
                  emotionMeta: { imageryTags: string[] };
                }
              ).emotionMeta.imageryTags
            : [],
      }),
    }),

  atmosphereImage: (imageryTags: string[], emotionalTone: string) =>
    request<{
      url: string;
      mimeType: string;
      prompt: string;
      provider: string;
    }>(
      "/image",
      {
        method: "POST",
        body: JSON.stringify({
          imageryTags,
          mood: emotionalTone,
          ratio: "16:9",
        }),
      },
      100_000,
    ).then((result) => ({
      ...result,
      imageUrl: result.url,
      imageData: undefined,
    })),
};
