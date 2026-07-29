import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-white/10 bg-space-950/35 px-4 text-sm text-mist-100 outline-none transition duration-500 placeholder:text-mist-500 focus:border-haze-cyan/35 focus:bg-space-950/50 focus:ring-4 focus:ring-haze-cyan/[.05]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
