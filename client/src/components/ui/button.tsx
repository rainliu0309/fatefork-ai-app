import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "soft" | "ghost" | "outline" | "danger";
type Size = "sm" | "default" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "border border-white/15 bg-mist-100 text-space-950 shadow-[0_10px_30px_rgba(216,215,231,.12)] hover:bg-white",
  soft:
    "border border-white/10 bg-white/[.07] text-mist-100 hover:border-white/20 hover:bg-white/[.11]",
  ghost: "text-mist-300 hover:bg-white/[.06] hover:text-white",
  outline:
    "border border-white/[.12] bg-transparent text-mist-200 hover:border-white/25 hover:bg-white/[.05]",
  danger:
    "border border-rose-300/15 bg-rose-300/[.06] text-rose-100 hover:bg-rose-300/[.1]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-xl px-3 text-xs",
  default: "h-11 rounded-2xl px-5 text-sm",
  lg: "h-12 rounded-2xl px-6 text-sm",
  icon: "size-10 rounded-xl",
};

// Shared with router links so links never need to wrap interactive buttons.
// eslint-disable-next-line react-refresh/only-export-components
export function buttonClassName({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium tracking-wide outline-none transition duration-500 focus-visible:ring-2 focus-visible:ring-haze-cyan/40 disabled:pointer-events-none disabled:opacity-40",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";
