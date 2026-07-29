import { Router } from "express";
import { badRequest } from "../errors.js";
import { asyncHandler, sendData } from "../middleware/http.js";
import { createReflectionCard } from "../services/generationService.js";
import {
  asRecord,
  optionalString,
  parseLocale,
  parseStringArray,
  requiredString,
} from "../utils/validation.js";

export const reflectionRouter = Router();

reflectionRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const sourceTypeValue = record.sourceType ?? record.source;
    if (typeof sourceTypeValue !== "string") {
      throw badRequest('"sourceType" (or "source") is required.');
    }
    const sourceType = sourceTypeValue.trim();
    if (!["ziwei", "tarot", "chat"].includes(sourceType)) {
      throw badRequest('"sourceType" must be "ziwei", "tarot", or "chat".');
    }
    if (!Array.isArray(record.answers) || record.answers.length < 1 || record.answers.length > 5) {
      throw badRequest('"answers" must contain 1-5 reflection answers.');
    }
    const narrative =
      typeof record.narrative === "object" && record.narrative !== null
        ? asRecord(record.narrative, "narrative")
        : undefined;
    const candidateQuestions =
      narrative && Array.isArray(narrative.reflectionQuestions)
        ? narrative.reflectionQuestions
        : narrative && Array.isArray(narrative.followupPrompts)
          ? narrative.followupPrompts
          : [];
    const answers = record.answers.map((value, index) => {
      if (typeof value === "string") {
        if (!value.trim() || value.trim().length > 3_000) {
          throw badRequest(`answers[${index}] must contain 1-3000 characters.`);
        }
        return {
          question:
            typeof candidateQuestions[index] === "string"
              ? candidateQuestions[index].slice(0, 500)
              : `自省问题 ${index + 1}`,
          answer: value.trim(),
        };
      }
      const item = asRecord(value, `answers[${index}]`);
      return {
        question: requiredString(item, "question", { max: 500 }),
        answer: requiredString(item, "answer", { max: 3_000 }),
      };
    });
    const nestedEmotion =
      narrative &&
      typeof narrative.emotionMeta === "object" &&
      narrative.emotionMeta !== null
        ? asRecord(narrative.emotionMeta, "narrative.emotionMeta")
        : narrative &&
            typeof narrative.emotion === "object" &&
            narrative.emotion !== null
          ? asRecord(narrative.emotion, "narrative.emotion")
          : undefined;
    const imagerySource = record.imageryTags ?? nestedEmotion?.imageryTags;
    const imageryTags =
      imagerySource === undefined
        ? []
        : parseStringArray(imagerySource, "imageryTags", {
            max: 6,
            itemMax: 80,
          });
    const result = await createReflectionCard({
      sourceType,
      answers,
      narrativeSummary:
        optionalString(record, "narrativeSummary", 4_000) ??
        optionalString(record, "sourceTitle", 300),
      imageryTags,
      locale: parseLocale(record.locale),
    });
    sendData(request, response, result, { mock: result.meta.provider === "mock" });
  }),
);
