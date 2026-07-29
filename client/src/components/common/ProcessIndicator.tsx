import { Check, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ProcessIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/[.07] bg-space-950/30 p-4">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border text-[10px] transition duration-500",
                done && "border-haze-cyan/25 bg-haze-cyan/10 text-haze-cyan",
                active && "border-haze-purple/30 bg-haze-purple/10 text-haze-purple",
                !done && !active && "border-white/[.07] text-mist-600",
              )}
            >
              {done ? (
                <Check className="size-3" />
              ) : active ? (
                <LoaderCircle className="size-3 animate-spin" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-xs font-light",
                done && "text-mist-400",
                active && "text-mist-200",
                !done && !active && "text-mist-600",
              )}
            >
              {label}
            </span>
            {active && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
                className="ml-auto text-[9px] tracking-[.16em] text-mist-500"
              >
                PROCESSING
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}
