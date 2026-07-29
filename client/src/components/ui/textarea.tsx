import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-space-950/35 px-4 py-3.5 text-sm leading-7 text-mist-100 outline-none transition duration-500 placeholder:text-mist-500 focus:border-haze-purple/35 focus:bg-space-950/50 focus:ring-4 focus:ring-haze-purple/[.05]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
