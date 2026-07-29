/**
 * Sites preview worker.
 *
 * The portfolio's canonical backend is Express (`server/**`). This small edge
 * adapter reuses the same deterministic engines and local mock narratives so
 * the published frontend remains interactive without storing user data or
 * exposing an Agnes key. It never performs RAG, tool calls, or agent loops.
 */
import { mockAbstractImage, mockReflectionCard, mockReflectiveReply, mockTarotNarrative, mockZiweiNarrative } from "../server/ai/mock";
import {
  drawThreeCardMirror,
  parseTarotDraw,
  pickSelfDrawSlot,
  prepareSelfDraw,
  revealSelfDrawSlots,
} from "../server/engine/tarot";
import { calculateZiweiChart } from "../server/engine/ziwei";
import type {
  EmotionMetadata,
  TarotNarrative,
  ZiweiChart,
  ZiweiNarrative,
} from "../server/types/api";

interface PreviewEnv {
  ASSETS: Fetcher;
}

type JsonRecord = Record<string, unknown>;

function json(data: unknown, status = 200) {
  return Response.json(
    {
      success: status < 400,
      ...(status < 400
        ? { data }
        : {
            error: {
              code: status === 404 ? "ROUTE_NOT_FOUND" : "PREVIEW_REQUEST_ERROR",
              message: String(data),
            },
          }),
      meta: {
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        mock: true,
      },
    },
    { status },
  );
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be a JSON object.");
  }
  return value as JsonRecord;
}

function clientEmotion(emotion: EmotionMetadata) {
  return {
    conflictIntensity: emotion.conflictIntensity,
    clarity: emotion.luminance,
    emotionalTone: emotion.tone,
    imageryTags: emotion.imageryTags,
    tempo:
      emotion.pace < 0.4 ? ("slow" as const) : emotion.pace < 0.7 ? ("steady" as const) : ("flowing" as const),
  };
}

function decorateZiwei(narrative: ZiweiNarrative) {
  return {
    ...narrative,
    opening: narrative.summary,
    alignedPath: narrative.paths.flow.chapters.map((chapter) => ({
      title: chapter.heading,
      body: chapter.narrative,
      phase: chapter.phase,
      reflection: chapter.choicePrompt,
    })),
    turningPath: narrative.paths.turn.chapters.map((chapter) => ({
      title: chapter.heading,
      body: chapter.narrative,
      phase: chapter.phase,
      reflection: chapter.choicePrompt,
    })),
    sharedReflection:
      `无论延续还是转向，两条路径都在邀请你辨认真实需要、可承担的代价与修订选择的时机。${narrative.reflectionQuestions[0]}`,
    emotionMeta: clientEmotion(narrative.emotion),
  };
}

function decorateTarot(narrative: TarotNarrative) {
  const section = (index: number) => ({
    title: narrative.layers[index].heading,
    body: narrative.layers[index].narrative,
    reflection: narrative.layers[index].gentlePrompt,
  });
  const perspectives = narrative.possibilities.filter(
    (item): item is string => typeof item === "string",
  );
  return {
    ...narrative,
    situation: section(0),
    innerBlock: section(1),
    possibilities: perspectives.map((body, index) => ({
      title: `可能性视角 ${index + 1}`,
      body,
      reflection: narrative.layers[2].gentlePrompt,
    })),
    gentleAction: narrative.grounding,
    followupPrompts: narrative.reflectionQuestions,
    emotionMeta: clientEmotion(narrative.emotion),
  };
}

function chartFromRequest(body: JsonRecord): ZiweiChart {
  if (body.chart && typeof body.chart === "object") {
    const supplied = body.chart as { birth?: JsonRecord };
    const birth = asRecord(supplied.birth);
    return calculateZiweiChart({
      birthDate: String(birth.localDate),
      birthTime: String(birth.localTime),
      timezone: String(birth.timezone),
      ...(birth.place ? { place: String(birth.place) } : {}),
    });
  }
  const source = body.birth ? asRecord(body.birth) : body;
  return calculateZiweiChart({
    birthDate: String(source.birthDate),
    birthTime: String(source.birthTime),
    timezone: String(source.timezone),
    ...(source.place || source.birthplace
      ? { place: String(source.place || source.birthplace) }
      : {}),
  });
}

async function handleApi(request: Request) {
  const url = new URL(request.url);
  const body =
    request.method === "POST" ? asRecord(await request.json()) : ({} as JsonRecord);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({
      status: "ok",
      agnesConfigured: false,
      service: "fatefork-sites-preview",
      version: "1.0.0",
      agnes: {
        configured: false,
        mode: "mock",
        textModel: "fatefork-local-mock",
        imageModel: "fatefork-local-svg",
      },
      engines: {
        ziwei: "ziwei-rules-1.0.0",
        tarot: "tarot-crypto-1.0.0",
      },
    });
  }

  if (request.method === "POST" && url.pathname === "/api/ziwei/chart") {
    return json(chartFromRequest(body));
  }

  if (request.method === "POST" && url.pathname === "/api/ziwei/narrative") {
    return json(decorateZiwei(mockZiweiNarrative(chartFromRequest(body))));
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/draw") {
    return json(drawThreeCardMirror(), 201);
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/prepare") {
    return json(prepareSelfDraw(), 201);
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/pick") {
    if (typeof body.sessionId !== "string" || typeof body.slot !== "number") {
      throw new Error("请选择一张牌后再继续。");
    }
    return json(pickSelfDrawSlot(body.sessionId, body.slot));
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/reveal") {
    if (
      typeof body.sessionId !== "string" ||
      !Array.isArray(body.slots) ||
      body.slots.some((slot) => typeof slot !== "number")
    ) {
      throw new Error("请选择三张不同的牌后再翻开。");
    }
    return json(revealSelfDrawSlots(body.sessionId, body.slots));
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/narrative") {
    const draw = parseTarotDraw(body.draw ?? body.spread);
    return json(decorateTarot(mockTarotNarrative(draw)));
  }

  if (request.method === "POST" && url.pathname === "/api/tarot/followup") {
    const followup =
      typeof body.followup === "string" ? body.followup : "我想继续梳理这份感受。";
    return json(mockReflectiveReply(followup));
  }

  if (request.method === "POST" && url.pathname === "/api/chat") {
    const message =
      typeof body.message === "string" ? body.message : "我想慢慢梳理这个选择。";
    const reply = mockReflectiveReply(message);
    return json({ ...reply, reflectionPrompt: reply.questions[0] });
  }

  if (request.method === "POST" && url.pathname === "/api/reflection") {
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const imageryTags = Array.isArray(body.imageryTags)
      ? body.imageryTags.filter((item): item is string => typeof item === "string")
      : [];
    const card = mockReflectionCard(
      String(body.sourceType ?? body.source ?? "reflection"),
      answers.length,
      imageryTags,
    );
    return json({
      ...card,
      subtitle: card.eyebrow,
      closing: card.nextStep,
      createdAt: new Date().toISOString(),
    });
  }

  if (request.method === "POST" && url.pathname === "/api/image") {
    const imageryTags = Array.isArray(body.imageryTags)
      ? body.imageryTags.filter((item): item is string => typeof item === "string")
      : ["薄雾岔路", "浅青潮汐"];
    const image = mockAbstractImage(imageryTags, "16:9");
    return json({ ...image, imageUrl: image.url });
  }

  return json(`No preview route matches ${request.method} ${url.pathname}.`, 404);
}

export default {
  async fetch(request: Request, _env: PreviewEnv): Promise<Response> {
    try {
      return await handleApi(request);
    } catch (error) {
      return json(
        error instanceof Error ? error.message : "The preview request failed.",
        400,
      );
    }
  },
};
