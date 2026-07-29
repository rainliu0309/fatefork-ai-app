import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function InlineNotice({
  children,
  tone = "info",
  className,
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
  className?: string;
}) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-xs font-light leading-6",
        tone === "error"
          ? "border-rose-300/15 bg-rose-300/[.045] text-rose-100/80"
          : "border-haze-cyan/10 bg-haze-cyan/[.035] text-mist-400",
        className,
      )}
    >
      <Icon className="mt-1 size-3.5 shrink-0" strokeWidth={1.5} />
      <div>{children}</div>
    </div>
  );
}
