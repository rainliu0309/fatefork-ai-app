import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-white/[.045] px-2.5 py-1 text-[10px] tracking-[.14em] text-mist-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
