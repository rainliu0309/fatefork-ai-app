"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Circle, Waves } from "lucide-react";

export type TimelineTempo = "slow" | "steady" | "flowing";

export interface TimelineEmotionMetadata {
  /** A normalized 0–1 value supplied by the controlled narrative response. */
  conflictIntensity: number;
  imageryTags: string[];
  tempo: TimelineTempo;
}

export interface TimelineMoment {
  id?: string;
  /** A time range or narrative stage, for example “此刻” or “未来 1–2 年”. */
  label: string;
  title: string;
  narrative: string;
  reflection?: string;
  /** Optional per-node override, also normalized to 0–1. */
  conflictIntensity?: number;
  imageryTags?: string[];
}

export interface TimelineTrack {
  id?: string;
  label: string;
  eyebrow?: string;
  description?: string;
  moments: TimelineMoment[];
}

export interface GenerativeTimelineProps {
  /** Both entries receive identical layout weight and visual hierarchy. */
  tracks: readonly [TimelineTrack, TimelineTrack];
  metadata: TimelineEmotionMetadata;
  className?: string;
}

const TEMPO_SECONDS: Record<TimelineTempo, number> = {
  slow: 14,
  steady: 10,
  flowing: 7,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value || 0));

const hashTags = (tags: readonly string[]) =>
  tags.join("|").split("").reduce((total, character) => {
    return (total * 31 + character.charCodeAt(0)) % 997;
  }, 17);

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

interface TrackViewProps {
  track: TimelineTrack;
  trackIndex: number;
  metadata: TimelineEmotionMetadata;
  reduceMotion: boolean;
  headingId: string;
}

function TrackView({
  track,
  trackIndex,
  metadata,
  reduceMotion,
  headingId,
}: TrackViewProps) {
  const intensity = clamp01(metadata.conflictIntensity);
  const tagHash = hashTags(metadata.imageryTags);
  const duration = TEMPO_SECONDS[metadata.tempo];
  const amplitude = 3 + intensity * 11;
  const phaseDirection = (tagHash + trackIndex) % 2 === 0 ? 1 : -1;
  const glowAlpha = 0.2 + intensity * 0.28;

  return (
    <section
      aria-labelledby={headingId}
      className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(20,29,48,0.7),rgba(28,28,48,0.52))] p-5 shadow-[0_22px_70px_rgba(2,8,23,0.24)] backdrop-blur-xl sm:p-6"
    >
      <header className="relative z-10 min-h-28 border-b border-white/[0.08] pb-5">
        {track.eyebrow ? (
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-slate-300/[0.55]">
            {track.eyebrow}
          </p>
        ) : null}
        <h3
          id={headingId}
          className="text-xl font-light tracking-[0.08em] text-slate-50 sm:text-2xl"
        >
          {track.label}
        </h3>
        {track.description ? (
          <p className="mt-3 max-w-prose text-sm leading-6 text-slate-300/70">
            {track.description}
          </p>
        ) : null}
      </header>

      {track.moments.length > 0 ? (
        <div className="relative mt-6">
          <div
            aria-hidden="true"
            className="absolute bottom-3 left-[0.72rem] top-3 w-px bg-gradient-to-b from-slate-200/10 via-slate-200/[0.35] to-slate-200/10"
          />
          <motion.div
            aria-hidden="true"
            className="absolute left-[0.58rem] top-2 h-14 w-[0.3rem] rounded-full bg-gradient-to-b from-transparent via-slate-100/70 to-transparent blur-[1px]"
            animate={
              reduceMotion
                ? { opacity: 0.35 }
                : {
                    top: ["1%", "88%"],
                    x: [
                      -amplitude * phaseDirection * 0.3,
                      amplitude * phaseDirection * 0.3,
                      -amplitude * phaseDirection * 0.3,
                    ],
                    opacity: [0, 0.8, 0],
                  }
            }
            transition={{
              duration,
              ease: "linear",
              repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            }}
          />

          <ol className="space-y-5">
            {track.moments.map((moment, momentIndex) => {
              const nodeIntensity = clamp01(
                moment.conflictIntensity ?? metadata.conflictIntensity,
              );
              const nodeTags = moment.imageryTags?.length
                ? moment.imageryTags
                : metadata.imageryTags;
              const localHash = hashTags(nodeTags);
              const direction =
                (localHash + momentIndex + trackIndex) % 2 === 0 ? 1 : -1;
              const offset = direction * (2 + nodeIntensity * 9);
              const nodeGlow = 0.18 + nodeIntensity * 0.38;

              return (
                <motion.li
                  key={moment.id ?? `${moment.label}-${momentIndex}`}
                  className="relative pl-9"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.7,
                    delay: momentIndex * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute left-[0.38rem] top-[1.2rem] grid h-3 w-3 place-items-center rounded-full border border-slate-100/[0.55] bg-[#172239]"
                    animate={
                      reduceMotion
                        ? { x: 0 }
                        : {
                            x: [0, offset, 0],
                            boxShadow: [
                              `0 0 0 3px rgba(203,213,225,0.06), 0 0 12px rgba(199,210,254,${nodeGlow})`,
                              `0 0 0 5px rgba(203,213,225,0.09), 0 0 22px rgba(199,210,254,${Math.min(0.65, nodeGlow + 0.14)})`,
                              `0 0 0 3px rgba(203,213,225,0.06), 0 0 12px rgba(199,210,254,${nodeGlow})`,
                            ],
                          }
                    }
                    transition={{
                      duration: duration * 0.78,
                      delay: momentIndex * 0.35,
                      ease: "easeInOut",
                      repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
                    }}
                  >
                    <Circle className="h-1.5 w-1.5 fill-current text-slate-100/80" />
                  </motion.span>

                  <article
                    className="rounded-2xl border border-white/[0.075] bg-white/[0.035] p-4 transition-colors duration-700 hover:bg-white/[0.055]"
                    style={{
                      boxShadow: `0 12px 40px rgba(4, 9, 24, 0.18), inset 0 1px 0 rgba(255,255,255,${glowAlpha * 0.18})`,
                    }}
                  >
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-slate-300/50">
                      {moment.label}
                    </p>
                    <h4 className="mt-2 text-base font-medium tracking-wide text-slate-100/90">
                      {moment.title}
                    </h4>
                    <p className="mt-2 text-sm font-light leading-7 text-slate-300/75">
                      {moment.narrative}
                    </p>
                    {moment.reflection ? (
                      <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm leading-6 text-[#c8d8dd]/70">
                        {moment.reflection}
                      </p>
                    ) : null}
                  </article>
                </motion.li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400/70">
          这条路径仍在形成，稍后再看。
        </div>
      )}
    </section>
  );
}

/**
 * Two equally weighted narrative tracks. Metadata affects movement only—not
 * color semantics—so neither path is framed as the “good” or “bad” option.
 */
export function GenerativeTimeline({
  tracks,
  metadata,
  className = "",
}: GenerativeTimelineProps) {
  const shouldReduceMotion = useReducedMotion();
  const componentId = useId();
  const tags = Array.from(
    new Set(metadata.imageryTags.filter(Boolean)),
  ).slice(0, 6);

  return (
    <div className={joinClasses("w-full", className)}>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs tracking-[0.12em] text-slate-300/60">
          <Waves className="h-4 w-4" aria-hidden="true" />
          <span>两条路径，同等展开</span>
        </div>
        {tags.length > 0 ? (
          <ul
            aria-label="叙事意象"
            className="flex flex-wrap gap-1.5"
          >
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[0.68rem] tracking-wide text-slate-300/[0.55]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="sr-only">
        动态强度 {Math.round(clamp01(metadata.conflictIntensity) * 100)}%，
        节奏为 {metadata.tempo}。动画仅表达叙事情绪，不代表路径优劣。
      </p>

      <div className="grid items-start gap-4 md:grid-cols-2 lg:gap-6">
        {tracks.map((track, index) => (
          <TrackView
            key={track.id ?? `${track.label}-${index}`}
            track={track}
            trackIndex={index}
            metadata={metadata}
            reduceMotion={Boolean(shouldReduceMotion)}
            headingId={`${componentId}-track-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

export const DualTrackTimeline = GenerativeTimeline;
