"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";

/**
 * A low-contrast cursor halo for fine pointers. It deliberately leaves the
 * native cursor intact, and disappears completely on touch/reduced-motion
 * devices so it never competes with reading or controls.
 */
export function PointerAura() {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);
  const x = useSpring(rawX, { stiffness: 72, damping: 24, mass: 0.55 });
  const y = useSpring(rawY, { stiffness: 72, damping: 24, mass: 0.55 });
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    const media = window.matchMedia("(pointer: fine)");
    const syncPointerCapability = () => {
      setEnabled(media.matches);
      if (!media.matches) setVisible(false);
    };
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      setVisible(true);
    };
    const hide = () => setVisible(false);

    syncPointerCapability();
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("blur", hide);
    media.addEventListener("change", syncPointerCapability);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("blur", hide);
      media.removeEventListener("change", syncPointerCapability);
    };
  }, [rawX, rawY, reduceMotion]);

  if (!enabled || reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-[5] hidden size-0 md:block"
      style={{ left: x, top: y }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <span className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(155,198,201,.105)_0%,rgba(170,160,200,.055)_30%,transparent_67%)] blur-2xl" />
      <span className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-haze-cyan/[.13] bg-white/[.015] shadow-[0_0_26px_rgba(155,198,201,.12)]" />
      <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mist-200/65 shadow-[0_0_10px_rgba(238,237,246,.7)]" />
    </motion.div>
  );
}
