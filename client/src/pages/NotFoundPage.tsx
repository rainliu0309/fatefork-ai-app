import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="page-container grid min-h-screen place-items-center">
      <div className="text-center">
        <p className="text-[10px] tracking-[.28em] text-mist-500">404 · UNMAPPED PATH</p>
        <h1 className="mt-5 text-4xl font-light text-mist-100">这条岔路尚未展开</h1>
        <p className="mt-4 text-sm font-light text-mist-500">回到起点，选择一条此刻可见的路径。</p>
        <Link
          to="/"
          className={buttonClassName({
            variant: "soft",
            className: "mt-8",
          })}
        >
          <ArrowLeft className="size-4" />
          返回首页
        </Link>
      </div>
    </section>
  );
}
