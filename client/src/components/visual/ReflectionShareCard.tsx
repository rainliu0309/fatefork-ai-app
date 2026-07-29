"use client";

import { useState } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";
import { useLocale } from "@/lib/locale";

export interface ReflectionShareCardContent {
  title?: string;
  channelLabel: string;
  dateLabel?: string;
  summary: string;
  reflections?: string[];
  imageryTags?: string[];
  closingLine?: string;
  disclaimer?: string;
  /** Controls only the share-card interface copy, not user-generated content. */
  locale?: "zh-CN" | "en";
}

export interface ReflectionShareCardProps {
  content: ReflectionShareCardContent;
  fileName?: string;
  downloadLabel?: string;
  onDownload?: (blob: Blob) => void;
  className?: string;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
};

const splitCanvasLines = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const characters = Array.from(text.trim());
  const lines: string[] = [];
  let currentLine = "";

  for (const character of characters) {
    const nextLine = currentLine + character;
    if (context.measureText(nextLine).width <= maxWidth || currentLine.length === 0) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine.trim());
    currentLine = character;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  const consumedCharacters = lines.join("").length;
  if (consumedCharacters < characters.join("").trim().length && lines.length > 0) {
    let finalLine = lines[lines.length - 1];
    while (
      finalLine.length > 0 &&
      context.measureText(`${finalLine}…`).width > maxWidth
    ) {
      finalLine = finalLine.slice(0, -1);
    }
    lines[lines.length - 1] = `${finalLine.trim()}…`;
  }

  return lines;
};

const drawMultilineText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) => {
  const lines = splitCanvasLines(context, text, maxWidth, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
};

const seededPoint = (index: number, salt: number) => {
  const value = Math.sin(index * 91.17 + salt * 17.31) * 10_000;
  return value - Math.floor(value);
};

/**
 * Renders the share card to a standalone 1080×1350 PNG Blob. The generated
 * asset contains no remote imagery, so it remains download-safe across hosts.
 */
// The renderer is also exported for callers that need a Blob without UI.
// eslint-disable-next-line react-refresh/only-export-components
export async function createReflectionCardPng(
  content: ReflectionShareCardContent,
): Promise<Blob> {
  const isEnglish = content.locale === "en";
  // Keep downloaded cards consistent with the in-page preview, including old
  // records created before prompts were prevented from leaking here.
  const closingLine = /[？?]\s*$/.test(content.closingLine?.trim() ?? "")
    ? undefined
    : content.closingLine;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#0a1324");
  background.addColorStop(0.5, "#15172a");
  background.addColorStop(1, "#101d2b");
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const upperGlow = context.createRadialGradient(230, 180, 0, 230, 180, 500);
  upperGlow.addColorStop(0, "rgba(161, 179, 216, 0.2)");
  upperGlow.addColorStop(1, "rgba(161, 179, 216, 0)");
  context.fillStyle = upperGlow;
  context.fillRect(0, 0, CARD_WIDTH, 720);

  const lowerGlow = context.createRadialGradient(920, 1120, 0, 920, 1120, 520);
  lowerGlow.addColorStop(0, "rgba(174, 157, 201, 0.13)");
  lowerGlow.addColorStop(1, "rgba(174, 157, 201, 0)");
  context.fillStyle = lowerGlow;
  context.fillRect(400, 600, 680, 750);

  for (let index = 0; index < 52; index += 1) {
    const x = seededPoint(index, 1) * CARD_WIDTH;
    const y = seededPoint(index, 2) * CARD_HEIGHT;
    const radius = 0.7 + seededPoint(index, 3) * 1.6;
    context.beginPath();
    context.fillStyle = `rgba(215, 224, 238, ${0.08 + seededPoint(index, 4) * 0.18})`;
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  roundedRect(context, 72, 68, 936, 1214, 42);
  context.fillStyle = "rgba(255, 255, 255, 0.035)";
  context.fill();
  context.strokeStyle = "rgba(226, 232, 240, 0.14)";
  context.lineWidth = 2;
  context.stroke();

  context.textBaseline = "top";
  context.fillStyle = "rgba(215, 224, 238, 0.58)";
  context.font =
    '500 21px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  context.fillText(content.channelLabel.toUpperCase(), 126, 125);

  if (content.dateLabel) {
    context.textAlign = "right";
    context.fillText(content.dateLabel, 954, 125);
    context.textAlign = "left";
  }

  context.fillStyle = "#f1f5f9";
  context.font =
    '300 52px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  const titleLine = splitCanvasLines(
    context,
    content.title ?? "我的命运岔途复盘",
    828,
    1,
  )[0];
  context.fillText(titleLine, 126, 188);

  const divider = context.createLinearGradient(126, 0, 954, 0);
  divider.addColorStop(0, "rgba(203, 213, 225, 0.42)");
  divider.addColorStop(1, "rgba(203, 213, 225, 0)");
  context.fillStyle = divider;
  context.fillRect(126, 278, 828, 2);

  context.fillStyle = "rgba(226, 232, 240, 0.84)";
  context.font =
    '300 32px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  let cursorY = drawMultilineText(context, content.summary, 126, 340, 828, 54, 6);

  const tags = Array.from(
    new Set((content.imageryTags ?? []).filter(Boolean)),
  ).slice(0, 5);
  if (tags.length > 0) {
    cursorY += 28;
    context.font =
      '400 20px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    let tagX = 126;

    for (const tag of tags) {
      const tagWidth = context.measureText(tag).width + 44;
      if (tagX + tagWidth > 954) break;
      roundedRect(context, tagX, cursorY, tagWidth, 44, 22);
      context.fillStyle = "rgba(226, 232, 240, 0.06)";
      context.fill();
      context.strokeStyle = "rgba(226, 232, 240, 0.12)";
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = "rgba(215, 224, 238, 0.6)";
      context.fillText(tag, tagX + 22, cursorY + 10);
      tagX += tagWidth + 12;
    }
    cursorY += 80;
  } else {
    cursorY += 48;
  }

  const reflections = (content.reflections ?? []).filter(Boolean).slice(0, 3);
  if (reflections.length > 0) {
    context.fillStyle = "rgba(203, 213, 225, 0.48)";
    context.font =
      '500 18px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    context.fillText(isEnglish ? "WHAT I WANT TO REMEMBER" : "此刻，我想记住", 126, cursorY);
    cursorY += 48;

    const linesPerReflection = reflections.length >= 3 ? 1 : 2;
    reflections.forEach((reflection, index) => {
      context.beginPath();
      context.fillStyle = "rgba(203, 213, 225, 0.54)";
      context.arc(137, cursorY + 13, 5, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "rgba(226, 232, 240, 0.72)";
      context.font =
        '300 25px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
      cursorY = drawMultilineText(
        context,
        reflection,
        168,
        cursorY,
        760,
        40,
        linesPerReflection,
      );
      if (index < reflections.length - 1) cursorY += 22;
    });
  }

  if (closingLine) {
    const closingY = Math.min(1060, Math.max(cursorY + 36, 940));
    context.fillStyle = "rgba(197, 215, 219, 0.76)";
    context.font =
      '300 27px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    drawMultilineText(context, closingLine, 126, closingY, 828, 43, 2);
  }

  context.fillStyle = "rgba(203, 213, 225, 0.28)";
  context.fillRect(126, 1162, 828, 1);

  context.fillStyle = "rgba(226, 232, 240, 0.6)";
  context.font =
    '500 18px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  context.fillText(
    isEnglish ? "FATE FORK  ·  CHOICE PATHS" : "FATE FORK  ·  命运岔途",
    126,
    1204,
  );

  context.textAlign = "right";
  context.fillStyle = "rgba(203, 213, 225, 0.34)";
  context.font =
    '300 15px Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
  context.fillText(
    content.disclaimer ?? (isEnglish
      ? "This narrative is for reflection only. You remain the author of your life."
      : "叙事仅供自省参考，你始终是生活的作者"),
    954,
    1207,
  );
  context.textAlign = "left";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Unable to create the reflection card."));
      },
      "image/png",
      1,
    );
  });
}

const safeFileName = (fileName: string) => {
  const normalized = fileName
    .replace(/\.png$/i, "")
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\p{Cc}/gu, "-")
    .trim();
  return `${normalized || "fate-fork-reflection"}.png`;
};

export function ReflectionShareCard({
  content,
  fileName = "fate-fork-reflection.png",
  downloadLabel = "下载复盘卡",
  onDownload,
  className = "",
}: ReflectionShareCardProps) {
  const { isEnglish } = useLocale();
  const [downloadState, setDownloadState] = useState<
    "idle" | "rendering" | "done" | "error"
  >("idle");
  // Older locally saved cards may still contain a prompt in this field.
  const closingLine = /[？?]\s*$/.test(content.closingLine?.trim() ?? "")
    ? undefined
    : content.closingLine;

  const handleDownload = async () => {
    if (downloadState === "rendering") return;

    setDownloadState("rendering");
    try {
      const blob = await createReflectionCardPng({
        ...content,
        locale: isEnglish ? "en" : "zh-CN",
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = safeFileName(fileName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      onDownload?.(blob);
      setDownloadState("done");
      window.setTimeout(() => setDownloadState("idle"), 2_200);
    } catch {
      setDownloadState("error");
    }
  };

  return (
    <figure className={className}>
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[linear-gradient(145deg,rgba(13,24,43,0.96),rgba(34,31,55,0.92)_52%,rgba(18,34,47,0.94))] p-6 shadow-[0_30px_90px_rgba(2,8,23,0.32)] sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-20 -z-10 h-64 w-64 rounded-full bg-[#a6b9db]/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-16 -z-10 h-72 w-72 rounded-full bg-[#ad9fc8]/10 blur-3xl"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-[0.65rem] uppercase tracking-[0.2em] text-slate-300/[0.45]">
          <span>{content.channelLabel}</span>
          {content.dateLabel ? <time>{content.dateLabel}</time> : null}
        </div>

        <h3 className="mt-7 text-2xl font-light tracking-[0.07em] text-slate-50 sm:text-3xl">
          {content.title ?? (isEnglish ? "My Fate Fork reflection" : "我的命运岔途复盘")}
        </h3>
        <div className="my-6 h-px bg-gradient-to-r from-slate-200/30 to-transparent" />

        <blockquote className="text-base font-light leading-8 text-slate-200/80 sm:text-lg sm:leading-9">
          {content.summary}
        </blockquote>

        {content.imageryTags?.length ? (
          <ul aria-label={isEnglish ? "Imagery tags" : "意象标签"} className="mt-5 flex flex-wrap gap-2">
            {Array.from(new Set(content.imageryTags))
              .slice(0, 5)
              .map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[0.68rem] tracking-wide text-slate-300/[0.55]"
              >
                {tag}
              </li>
              ))}
          </ul>
        ) : null}

        {content.reflections?.length ? (
          <div className="mt-7 border-t border-white/[0.07] pt-6">
            <p className="text-[0.67rem] font-medium uppercase tracking-[0.18em] text-slate-300/[0.45]">
              {isEnglish ? "WHAT I WANT TO REMEMBER" : "此刻，我想记住"}
            </p>
            <ul className="mt-4 space-y-3">
              {content.reflections.slice(0, 3).map((reflection, index) => (
                <li
                  key={`${reflection}-${index}`}
                  className="flex gap-3 text-sm font-light leading-6 text-slate-300/70"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-200/[0.45]"
                  />
                  <span>{reflection}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {closingLine ? (
          <p className="mt-7 text-sm font-light leading-7 text-[#c5d7db]/70">
            {closingLine}
          </p>
        ) : null}

        <figcaption className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.07] pt-5">
          <span className="text-[0.65rem] font-medium tracking-[0.15em] text-slate-200/[0.55]">
            {isEnglish ? "FATE FORK · CHOICE PATHS" : "FATE FORK · 命运岔途"}
          </span>
          <span className="max-w-none whitespace-nowrap text-right text-[0.58rem] leading-5 tracking-[0.01em] text-slate-400/40 sm:text-[0.62rem] max-[540px]:whitespace-normal">
            {content.disclaimer ?? (isEnglish
              ? "This narrative is for reflection only. You remain the author of your life."
              : "叙事仅供自省参考，你始终是生活的作者")}
          </span>
        </figcaption>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <p
          aria-live="polite"
          className={`text-xs ${
            downloadState === "error"
              ? "text-rose-200/70"
              : "text-slate-300/50"
          }`}
        >
          {downloadState === "error"
            ? isEnglish ? "Generation failed. Please try again." : "生成失败，请稍后重试"
            : downloadState === "done"
              ? isEnglish ? "Image saved" : "图片已保存"
              : ""}
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloadState === "rendering"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.055] px-4 text-sm text-slate-100/75 transition-colors duration-500 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/50 disabled:cursor-wait disabled:opacity-60"
        >
          {downloadState === "rendering" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : downloadState === "done" ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {downloadState === "rendering"
            ? isEnglish ? "Creating…" : "正在生成…"
            : isEnglish && downloadLabel === "下载复盘卡" ? "Download reflection card" : downloadLabel}
        </button>
      </div>
    </figure>
  );
}
