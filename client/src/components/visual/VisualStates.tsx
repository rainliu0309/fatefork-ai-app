"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleDashed, LoaderCircle } from "lucide-react";

export interface VisualLoadingStateProps {
  title?: string;
  description?: string;
  steps?: readonly string[];
  activeStep?: number;
  compact?: boolean;
  className?: string;
}

export interface VisualEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function VisualLoadingState({
  title = "正在展开叙事",
  description = "正在安静地整理线索，请稍候。",
  steps,
  activeStep = 0,
  compact = false,
  className = "",
}: VisualLoadingStateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`relative isolate overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] px-5 text-center shadow-[0_18px_60px_rgba(2,8,23,0.2)] backdrop-blur-xl ${
        compact ? "py-8" : "py-14 sm:py-16"
      } ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#aebbd6]/[0.06] blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.035]"
        animate={
          reduceMotion
            ? { opacity: 0.75 }
            : {
                boxShadow: [
                  "0 0 0 0 rgba(203,213,225,0.03)",
                  "0 0 0 12px rgba(203,213,225,0.07)",
                  "0 0 0 0 rgba(203,213,225,0.03)",
                ],
              }
        }
        transition={{
          duration: 3.2,
          ease: "easeInOut",
          repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
        }}
      >
        <LoaderCircle
          className={`h-5 w-5 text-slate-200/[0.65] ${
            reduceMotion ? "" : "animate-spin [animation-duration:2.8s]"
          }`}
        />
      </motion.div>

      <h3 className="mt-5 text-lg font-light tracking-[0.08em] text-slate-100/90">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm font-light leading-6 text-slate-300/[0.55]">
          {description}
        </p>
      ) : null}

      {steps?.length ? (
        <ol
          aria-label="处理进度"
          className="mx-auto mt-6 flex max-w-lg flex-wrap items-center justify-center gap-2"
        >
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isComplete = index < activeStep;
            return (
              <li
                key={step}
                aria-current={isActive ? "step" : undefined}
                className={`rounded-full border px-3 py-1.5 text-[0.68rem] tracking-wide transition-colors duration-700 ${
                  isActive
                    ? "border-slate-200/20 bg-slate-200/[0.08] text-slate-100/75"
                    : isComplete
                      ? "border-[#b7ccd0]/[0.15] bg-[#b7ccd0]/[0.045] text-[#c5d8db]/60"
                      : "border-white/[0.06] bg-white/[0.02] text-slate-400/[0.35]"
                }`}
              >
                {step}
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

export function VisualEmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: VisualEmptyStateProps) {
  return (
    <div
      className={`rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.025] px-5 py-12 text-center backdrop-blur-lg ${className}`}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-300/[0.45]">
        {icon ?? <CircleDashed className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h3 className="mt-5 text-base font-light tracking-[0.08em] text-slate-100/80">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-6 text-slate-300/50">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 min-h-11 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm text-slate-200/70 transition-colors duration-500 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/50"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export const LoadingState = VisualLoadingState;
export const EmptyState = VisualEmptyState;
