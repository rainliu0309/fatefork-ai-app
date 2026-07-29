"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Layers3, RotateCcw } from "lucide-react";

export type TarotOrientation = "upright" | "reversed";

export interface TarotVisualCard {
  id?: string;
  name: string;
  position: string;
  orientation: TarotOrientation;
  keywords?: string[];
  interpretation?: string;
}

export interface TarotFlipSpreadProps {
  cards: readonly TarotVisualCard[];
  /** Reveals the three cards in sequence; disabled by default to preserve agency. */
  autoReveal?: boolean;
  autoRevealDelay?: number;
  onReveal?: (card: TarotVisualCard, index: number) => void;
  className?: string;
}

const cardKey = (card: TarotVisualCard, index: number) =>
  card.id ?? `${card.position}-${card.name}-${index}`;

/**
 * A minimal three-card spread with no reproduced tarot artwork. Its quiet
 * geometry is intentionally neutral and leaves interpretation to the text.
 */
export function TarotFlipSpread({
  cards,
  autoReveal = false,
  autoRevealDelay = 520,
  onReveal,
  className = "",
}: TarotFlipSpreadProps) {
  const displayedCards = useMemo(() => cards.slice(0, 3), [cards]);
  const signature = displayedCards
    .map((card, index) => cardKey(card, index))
    .join("|");
  const [revealedCards, setRevealedCards] = useState<Set<string>>(
    () => new Set(),
  );
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setRevealedCards(new Set());
    if (!autoReveal) return;

    const timeouts = displayedCards.map((card, index) =>
      window.setTimeout(
        () => {
          const key = cardKey(card, index);
          setRevealedCards((current) => new Set(current).add(key));
          onReveal?.(card, index);
        },
        reduceMotion ? 0 : autoRevealDelay * (index + 1),
      ),
    );

    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
    // `signature` resets the visual only when the actual card identities change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReveal, autoRevealDelay, reduceMotion, signature]);

  const revealCard = (card: TarotVisualCard, index: number) => {
    const key = cardKey(card, index);
    if (revealedCards.has(key)) return;

    setRevealedCards((current) => new Set(current).add(key));
    onReveal?.(card, index);
  };

  const revealAll = () => {
    displayedCards.forEach((card, index) => {
      const key = cardKey(card, index);
      if (!revealedCards.has(key)) onReveal?.(card, index);
    });
    setRevealedCards(
      new Set(displayedCards.map((card, index) => cardKey(card, index))),
    );
  };

  const reset = () => setRevealedCards(new Set());
  const allRevealed =
    displayedCards.length > 0 && revealedCards.size >= displayedCards.length;

  if (displayedCards.length === 0) {
    return (
      <div
        className={`rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-5 py-14 text-center text-sm text-slate-400/70 ${className}`}
      >
        抽牌完成后，三张镜像会在这里出现。
      </div>
    );
  }

  return (
    <section
      aria-label="三张塔罗镜像牌阵"
      className={className}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 tracking-[0.12em] text-slate-300/[0.55]">
          依次翻开，观察你的第一反应
        </p>
        <button
          type="button"
          onClick={allRevealed ? reset : revealAll}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 text-xs tracking-wide text-slate-200/70 transition-colors duration-500 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/50"
        >
          {allRevealed ? (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {allRevealed ? "重新合上" : "全部翻开"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {displayedCards.map((card, index) => {
          const key = cardKey(card, index);
          const revealed = revealedCards.has(key);
          const OrientationIcon =
            card.orientation === "upright" ? ArrowUp : ArrowDown;

          return (
            <button
              key={key}
              type="button"
              aria-label={`${card.position}：${revealed ? `${card.name}，${card.orientation === "upright" ? "正位" : "逆位"}` : "尚未翻开"}`}
              aria-pressed={revealed}
              onClick={() => revealCard(card, index)}
              className="group relative h-[24rem] w-full cursor-pointer rounded-[1.6rem] text-left [perspective:1200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0b1220] sm:h-[26rem]"
            >
              <motion.span
                className="relative block h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: revealed ? 180 : 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 1.05,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduceMotion ? 0 : index * 0.04,
                }}
              >
                <span
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-[1.6rem] border border-white/[0.12] bg-[linear-gradient(145deg,rgba(30,42,66,0.94),rgba(38,32,61,0.9))] p-4 shadow-[0_24px_70px_rgba(2,8,23,0.3)] [backface-visibility:hidden]"
                >
                  <span className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.2em] text-slate-300/[0.45]">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{card.position}</span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="relative my-auto block h-52 rounded-[1.2rem] border border-white/[0.08] bg-[radial-gradient(circle_at_50%_38%,rgba(190,202,225,0.12),transparent_44%),linear-gradient(160deg,rgba(255,255,255,0.035),transparent)]"
                  >
                    <span className="absolute left-1/2 top-1/2 h-24 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200/30 to-transparent transition-transform duration-1000 group-hover:scale-y-110" />
                    <span className="absolute left-1/2 top-1/2 h-px w-20 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200/25 to-transparent transition-transform duration-1000 group-hover:scale-x-110" />
                    <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/10" />
                  </span>

                  <span className="text-center text-xs tracking-[0.14em] text-slate-300/[0.55]">
                    点击翻开
                  </span>
                </span>

                <span
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-[1.6rem] border border-white/[0.12] bg-[linear-gradient(150deg,rgba(24,35,57,0.96),rgba(44,38,65,0.94))] p-5 shadow-[0_24px_70px_rgba(2,8,23,0.34)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-300/[0.45]">
                      {card.position}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[0.65rem] tracking-wide text-slate-200/60">
                      <OrientationIcon className="h-3 w-3" aria-hidden="true" />
                      {card.orientation === "upright" ? "正位" : "逆位"}
                    </span>
                  </span>

                  <span className="my-auto block">
                    <span className="block text-center text-xl font-light tracking-[0.08em] text-slate-50/90">
                      {card.name}
                    </span>
                    {card.keywords?.length ? (
                      <span className="mt-4 flex flex-wrap justify-center gap-1.5">
                        {Array.from(new Set(card.keywords))
                          .slice(0, 4)
                          .map((keyword) => (
                          <span
                            key={keyword}
                            className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[0.65rem] text-slate-300/[0.55]"
                          >
                            {keyword}
                          </span>
                          ))}
                      </span>
                    ) : null}
                    {card.interpretation ? (
                      <span className="mt-5 block border-t border-white/[0.07] pt-4 text-sm font-light leading-6 text-slate-300/70">
                        {card.interpretation}
                      </span>
                    ) : null}
                  </span>

                  <span className="text-center text-[0.65rem] leading-5 tracking-wide text-slate-400/[0.45]">
                    一种观察视角，而非结果判定
                  </span>
                </span>
              </motion.span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {allRevealed ? (
          <motion.p
            className="mt-4 text-center text-xs leading-5 text-slate-300/[0.45]"
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            aria-live="polite"
          >
            三张镜像已经展开。你可以先停留片刻，再阅读叙事。
          </motion.p>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
