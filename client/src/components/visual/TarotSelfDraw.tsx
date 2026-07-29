"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useLocale } from "@/lib/locale";

export interface TarotSelfDrawProps {
  slotCount: number;
  selectedSlots: number[];
  requiredSelections: number;
  disabled?: boolean;
  onSelect: (slot: number) => void;
  onDeselect: (slot: number) => void;
  className?: string;
}

const positionLabels = ["此刻镜面", "内在阻力", "可能路径"];
const positionLabelsEnglish = ["Present mirror", "Inner block", "Possible paths"];

/**
 * An overlapping horizontal spread, designed to feel like a single deck being
 * opened on a table. The three choices are collected locally first; card
 * identities remain concealed by the server until the user reveals the set.
 */
export function TarotSelfDraw({
  slotCount,
  selectedSlots,
  requiredSelections,
  disabled = false,
  onSelect,
  onDeselect,
  className = "",
}: TarotSelfDrawProps) {
  const { isEnglish } = useLocale();
  const reduceMotion = useReducedMotion();
  const canChooseMore = selectedSlots.length < requiredSelections;
  const labels = isEnglish ? positionLabelsEnglish : positionLabels;

  return (
    <section aria-label={isEnglish ? "Choose three cards yourself" : "亲自选择三张牌"} className={className}>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[.2em] text-mist-500">
            YOUR DRAW · {String(selectedSlots.length).padStart(2, "0")} / {String(requiredSelections).padStart(2, "0")}
          </p>
          <h2 className="mt-3 text-2xl font-light text-mist-100">
            {isEnglish ? "Choose three from the spread" : "从摊开的牌中，挑出三张"}
          </h2>
          <p className="mt-2 max-w-xl text-sm font-light leading-7 text-mist-500">
            {isEnglish
              ? "Selections fill the three positions from left to right, then turn together. There is no need to interpret them yet."
              : "选择会从左到右进入三个位；选好后再一起翻开，不急着解释。"}
          </p>
        </div>
      </div>

      <ol className="mb-8 grid gap-2 sm:grid-cols-3" aria-label={isEnglish ? "Order of the three selected cards" : "三张牌的选择顺序"}>
        {Array.from({ length: requiredSelections }, (_, index) => {
          const slot = selectedSlots[index];
          const chosen = slot !== undefined;
          return (
            <li
              key={labels[index] ?? index}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 transition duration-500 ${
                chosen
                  ? "border-haze-cyan/25 bg-haze-cyan/[.07] text-mist-200"
                  : "border-white/[.07] bg-white/[.018] text-mist-500"
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current/20 text-[0.62rem]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.62rem] tracking-[.14em] opacity-55">
                  {labels[index] ?? (isEnglish ? `Card ${index + 1}` : `第 ${index + 1} 张`)}
                </span>
                <span className="mt-0.5 block text-xs">
                  {chosen
                    ? isEnglish ? `Card ${slot + 1} selected` : `已选择第 ${slot + 1} 张`
                    : isEnglish ? "Awaiting selection" : "等待选择"}
                </span>
              </span>
              {chosen && !disabled ? (
                <button
                  type="button"
                  onClick={() => onDeselect(slot)}
                  aria-label={isEnglish ? `Remove card ${index + 1} selection` : `移除第 ${index + 1} 张选择`}
                  className="grid size-7 place-items-center rounded-full text-mist-500 transition hover:bg-white/[.07] hover:text-mist-200"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="overflow-x-auto pb-4 [scrollbar-color:rgba(173,159,200,.35)_transparent]">
        <div
          className="relative h-72 min-w-[980px]"
          style={{ width: Math.max(980, slotCount * 18 + 110) }}
        >
          {Array.from({ length: slotCount }, (_, slot) => {
            const selectedIndex = selectedSlots.indexOf(slot);
            const selected = selectedIndex !== -1;
            const cardDisabled = disabled || (!selected && !canChooseMore);
            const midpoint = (slotCount - 1) / 2;
            const normalizedOffset = midpoint ? (slot - midpoint) / midpoint : 0;
            const rotation = normalizedOffset * 18;
            const curveOffset = Math.abs(normalizedOffset) * 38;

            return (
              <motion.button
                key={slot}
                type="button"
                disabled={cardDisabled}
                aria-label={
                  selected
                    ? isEnglish
                      ? `Card ${slot + 1} is selected as choice ${selectedIndex + 1}. Click to remove.`
                      : `第 ${slot + 1} 张已作为第 ${selectedIndex + 1} 张选定，点击取消`
                    : isEnglish ? `Select card ${slot + 1}` : `选择第 ${slot + 1} 张`
                }
                onClick={() => (selected ? onDeselect(slot) : onSelect(slot))}
                initial={reduceMotion ? false : { opacity: 0, y: 16, rotate: rotation }}
                animate={{ opacity: 1, y: curveOffset, rotate: rotation }}
                transition={{
                  duration: 0.5,
                  delay: reduceMotion ? 0 : Math.min(slot * 0.018, 0.7),
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  cardDisabled || reduceMotion
                    ? undefined
                    : { y: curveOffset - 22, rotate: rotation + (slot % 2 ? 0.65 : -0.65) }
                }
                whileTap={cardDisabled || reduceMotion ? undefined : { scale: 0.98 }}
                style={{
                  left: 18 + slot * 18,
                  transformOrigin: "50% 100%",
                  zIndex: selected ? 100 + selectedIndex : slot + 1,
                }}
                className={`group absolute top-3 h-48 w-28 overflow-hidden rounded-2xl border text-left shadow-[0_20px_50px_rgba(2,8,23,0.2)] transition duration-500 sm:h-56 sm:w-32 ${
                  selected
                    ? "border-haze-cyan/45 bg-haze-cyan/[.11]"
                    : "border-white/[.11] bg-[linear-gradient(145deg,rgba(35,45,69,0.95),rgba(28,27,47,0.96))] hover:border-white/[.3] hover:bg-[linear-gradient(145deg,rgba(48,60,87,0.98),rgba(40,35,62,0.98))]"
                } ${cardDisabled && !selected ? "cursor-not-allowed opacity-35" : "cursor-pointer"}`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-3 rounded-xl border border-white/[.08] bg-[radial-gradient(circle_at_50%_38%,rgba(188,205,225,0.1),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent)]"
                >
                  <span className="absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-slate-200/35 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200/30 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/[.14]" />
                </span>
                <span className="absolute left-3 top-3 text-[0.6rem] tracking-[.16em] text-mist-500">
                  {String(slot + 1).padStart(2, "0")}
                </span>
                {selected ? (
                  <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full border border-haze-cyan/25 bg-haze-cyan/[.12] text-[0.62rem] text-haze-cyan">
                    {selectedIndex + 1}
                  </span>
                ) : null}
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[0.6rem] tracking-[.12em] text-mist-500">
                  <span>{selected ? (isEnglish ? "Selected" : "已选") : (isEnglish ? "Face down" : "背面牌")}</span>
                  {selected ? <Check className="size-3 text-haze-cyan" /> : null}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
