import { Badge } from "@/components/ui/badge";

export function PageIntro({
  eyebrow,
  title,
  description,
  step,
}: {
  eyebrow: string;
  title: string;
  description: string;
  step?: string;
}) {
  return (
    <header className="mb-9 max-w-3xl md:mb-12">
      <div className="mb-5 flex items-center gap-3">
        <Badge>{eyebrow}</Badge>
        {step && <span className="text-[10px] tracking-[.18em] text-mist-500">{step}</span>}
      </div>
      <h1 className="text-balance text-3xl font-light leading-tight tracking-[-.03em] text-mist-100 sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-sm font-light leading-7 text-mist-400 md:text-[15px] md:leading-8">
        {description}
      </p>
    </header>
  );
}
