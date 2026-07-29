import { Image, LoaderCircle, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AtmosphereImage({
  src,
  loading,
  onGenerate,
  description,
}: {
  src?: string;
  loading?: boolean;
  onGenerate: () => void;
  description: string;
}) {
  return (
    <div className="glass-panel relative aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/[.08] bg-gradient-to-br from-haze-purple/[.08] via-space-900/60 to-haze-cyan/[.07]">
      {src ? (
        <img
          src={src}
          alt="由叙事意象生成的抽象氛围图"
          className="h-full w-full object-cover opacity-80"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute -left-16 top-1/2 h-32 w-[120%] -rotate-6 rounded-[100%] border border-white/[.08] bg-white/[.015] blur-sm" />
          <div className="absolute -right-12 top-1/3 h-24 w-[90%] rotate-3 rounded-[100%] border border-haze-cyan/[.09]" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <Waves className="mx-auto size-6 text-mist-500" strokeWidth={1} />
              <p className="mx-auto mt-4 max-w-xs px-4 text-xs font-light leading-6 text-mist-500">
                {description}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-space-950/90 to-transparent p-5 pt-16">
        <p className="text-[9px] tracking-[.18em] text-mist-500">
          ABSTRACT ATMOSPHERE · 无符号意象
        </p>
        <Button size="sm" variant="soft" onClick={onGenerate} disabled={loading}>
          {loading ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Image className="size-3.5" />
          )}
          {src ? "重新生成" : "生成意境图"}
        </Button>
      </div>
    </div>
  );
}
