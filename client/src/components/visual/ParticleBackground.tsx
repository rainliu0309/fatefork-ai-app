"use client";

import { useEffect, useRef } from "react";

export interface ParticleBackgroundProps {
  /** Scales the number of particles while keeping the result responsive. */
  density?: number;
  /** Motion multiplier. Keep this low to preserve Fate Fork's calm visual rhythm. */
  speed?: number;
  /** Low-saturation colors accepted by the Canvas API. */
  palette?: readonly string[];
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  alpha: number;
  phase: number;
  phaseSpeed: number;
  color: string;
}

const DEFAULT_PALETTE = ["#b9c8e6", "#c8bfe2", "#a8d3d7", "#ddd4c5"] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A deliberately quiet Canvas particle field.
 *
 * The canvas is decorative, ignores pointer input, pauses when the tab is
 * hidden, and renders a still frame when the user prefers reduced motion.
 */
export function ParticleBackground({
  density = 1,
  speed = 1,
  palette = DEFAULT_PALETTE,
  className = "",
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;
    let animationFrame = 0;
    let previousTime = performance.now();
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let pageVisible = !document.hidden;

    const createParticles = () => {
      const safeDensity = clamp(density, 0.25, 2.5);
      const count = clamp(
        Math.round((width * height * safeDensity) / 24_000),
        18,
        90,
      );
      const colors = palette.length > 0 ? palette : DEFAULT_PALETTE;

      particles = Array.from({ length: count }, (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const baseVelocity = (0.018 + Math.random() * 0.032) * clamp(speed, 0, 3);

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.55 + Math.random() * 1.7,
          velocityX: Math.cos(angle) * baseVelocity,
          velocityY: Math.sin(angle) * baseVelocity - 0.006,
          alpha: 0.13 + Math.random() * 0.34,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.00035 + Math.random() * 0.00045,
          color: colors[index % colors.length],
        };
      });
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createParticles();
    };

    const draw = (time: number, shouldMove: boolean) => {
      context.clearRect(0, 0, width, height);
      const delta = Math.min(32, Math.max(0, time - previousTime));
      previousTime = time;

      for (const particle of particles) {
        if (shouldMove) {
          particle.x += particle.velocityX * delta;
          particle.y += particle.velocityY * delta;
          particle.phase += particle.phaseSpeed * delta;

          const margin = 12;
          if (particle.x < -margin) particle.x = width + margin;
          if (particle.x > width + margin) particle.x = -margin;
          if (particle.y < -margin) particle.y = height + margin;
          if (particle.y > height + margin) particle.y = -margin;
        }

        const pulse = 0.72 + Math.sin(particle.phase) * 0.28;
        context.beginPath();
        context.globalAlpha = particle.alpha * pulse;
        context.fillStyle = particle.color;
        context.shadowColor = particle.color;
        context.shadowBlur = 8;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      context.shadowBlur = 0;
    };

    const animate = (time: number) => {
      if (pageVisible) draw(time, !prefersReducedMotion);
      if (!prefersReducedMotion) animationFrame = window.requestAnimationFrame(animate);
    };

    const restartAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      previousTime = performance.now();
      draw(previousTime, false);
      if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      restartAnimation();
    };

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      previousTime = performance.now();
    };

    resize();
    restartAnimation();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [density, palette, speed]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 h-dvh w-screen overflow-hidden ${className}`}
    >
      <div className="absolute -left-24 top-[8%] h-72 w-72 rounded-full bg-[rgba(143,167,206,0.08)] blur-3xl" />
      <div className="absolute -right-20 bottom-[4%] h-80 w-80 rounded-full bg-[rgba(174,156,201,0.07)] blur-3xl" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
