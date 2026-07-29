import assert from "node:assert/strict";
import type { Server } from "node:http";
import test, { after, before } from "node:test";
import { createApp } from "../app.js";

let server: Server;
let baseUrl = "";

before(
  () =>
    new Promise<void>((resolve, reject) => {
      server = createApp().listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("Test server did not expose a TCP address."));
          return;
        }
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    }),
);

after(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

async function api(path: string, body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    json: (await response.json()) as Record<string, unknown>,
  };
}

test("health exposes service and model mode through the shared envelope", async () => {
  const result = await api("/health");
  assert.equal(result.status, 200);
  assert.equal(result.json.success, true);
  const data = result.json.data as Record<string, unknown>;
  assert.equal(data.status, "ok");
  assert.equal(data.service, "fatefork-api");
});

test("chart endpoint returns twelve backend-calculated palaces", async () => {
  const result = await api("/ziwei/chart", {
    birthDate: "1996-08-17",
    birthTime: "14:20",
    timezone: "Asia/Shanghai",
  });
  assert.equal(result.status, 200);
  const data = result.json.data as { palaces: unknown[]; explanation: unknown[] };
  assert.equal(data.palaces.length, 12);
  assert.ok(data.explanation.length >= 5);
});

test("draw endpoint returns the crypto three-card mirror spread", async () => {
  const result = await api("/tarot/draw", { question: "Should I change direction?" });
  assert.equal(result.status, 201);
  const data = result.json.data as {
    cards: Array<{ id: string }>;
    algorithm: string;
  };
  assert.equal(data.cards.length, 3);
  assert.equal(new Set(data.cards.map((card) => card.id)).size, 3);
  assert.equal(data.algorithm, "crypto Fisher-Yates");
});

test("validation errors use the same safe envelope", async () => {
  const result = await api("/ziwei/chart", {
    birthDate: "not-a-date",
    birthTime: "14:20",
    timezone: "Asia/Shanghai",
  });
  assert.equal(result.status, 400);
  assert.equal(result.json.success, false);
  const error = result.json.error as Record<string, unknown>;
  assert.equal(error.code, "VALIDATION_ERROR");
});

test("mock narrative flow satisfies the client-facing generative UI contract", async () => {
  const chartResult = await api("/ziwei/chart", {
    birthDate: "1996-08-17",
    birthTime: "14:20",
    timezone: "Asia/Shanghai",
  });
  const narrativeResult = await api("/ziwei/narrative", {
    chart: chartResult.json.data,
  });
  assert.equal(narrativeResult.status, 200);
  const narrative = narrativeResult.json.data as {
    alignedPath: unknown[];
    turningPath: unknown[];
    emotionMeta: { conflictIntensity: number };
    reflectionQuestions: unknown[];
  };
  assert.equal(narrative.alignedPath.length, 3);
  assert.equal(narrative.turningPath.length, 3);
  assert.equal(narrative.reflectionQuestions.length, 3);
  assert.ok(narrative.emotionMeta.conflictIntensity >= 0);
});

test("tarot narrative, chat, reflection, and image endpoints work without a key", async () => {
  const drawResult = await api("/tarot/draw", { question: "要不要尝试新的方向？" });
  const draw = drawResult.json.data;
  const tarotResult = await api("/tarot/narrative", {
    question: "要不要尝试新的方向？",
    draw,
  });
  assert.equal(tarotResult.status, 200);
  const tarot = tarotResult.json.data as {
    situation: { body: string };
    possibilities: unknown[];
    followupPrompts: unknown[];
  };
  assert.ok(tarot.situation.body.length > 0);
  assert.ok(tarot.possibilities.length >= 2);
  assert.equal(tarot.followupPrompts.length, 3);

  const chatResult = await api("/chat", { message: "我在两个工作方向之间犹豫。" });
  assert.equal(chatResult.status, 200);
  const chat = chatResult.json.data as { reply: string; reflectionPrompt: string };
  assert.ok(chat.reply.length > 0);
  assert.ok(chat.reflectionPrompt.length > 0);

  const reflectionResult = await api("/reflection", {
    sourceType: "tarot",
    answers: [
      { question: "我看见了什么？", answer: "我更需要可持续的节奏。" },
      { question: "各自代价？", answer: "新的方向需要学习时间。" },
      { question: "最小行动？", answer: "约一次信息访谈。" },
    ],
    imageryTags: ["薄雾", "潮汐", "微光"],
  });
  assert.equal(reflectionResult.status, 200);
  const reflection = reflectionResult.json.data as {
    subtitle: string;
    closing: string;
    createdAt: string;
  };
  assert.ok(reflection.subtitle.length > 0);
  assert.ok(reflection.closing.length > 0);
  assert.ok(Number.isFinite(Date.parse(reflection.createdAt)));

  const imageResult = await api("/image", {
    imageryTags: ["薄雾", "平行微光", "浅青潮汐"],
    ratio: "16:9",
  });
  assert.equal(imageResult.status, 200);
  const image = imageResult.json.data as { url: string; provider: string };
  assert.equal(image.provider, "mock");
  assert.match(image.url, /^data:image\/svg\+xml;base64,/);
});
