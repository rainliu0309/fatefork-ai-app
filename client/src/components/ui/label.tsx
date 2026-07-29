import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-2 block text-xs font-medium tracking-[.12em] text-mist-400",
        className,
      )}
      {...props}
    />
  );
}
