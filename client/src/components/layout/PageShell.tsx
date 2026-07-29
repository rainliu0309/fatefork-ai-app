import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ChevronLeft,
  Menu,
  MessageCircleMore,
  Orbit,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ParticleBackground } from "@/components/visual";

const navItems = [
  { to: "/ziwei", label: "星轨推演", icon: Orbit },
  { to: "/tarot", label: "即时镜像", icon: Sparkles },
  { to: "/chat", label: "随心闲谈", icon: MessageCircleMore },
  { to: "/history", label: "反宿命日志", icon: Archive },
];

export function PageShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMobileOpen(false);
    window.requestAnimationFrame(() =>
      mainRef.current?.focus({ preventScroll: true }),
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-space-950 text-mist-100">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-xl bg-mist-100 px-4 py-2 text-space-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        跳至主要内容
      </a>
      <ParticleBackground density={0.55} speed={0.55} />
      <div className="ambient-orb ambient-orb-a" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-b" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-7 md:pt-5">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between rounded-2xl border border-white/[.08] bg-space-950/55 px-3 shadow-glass backdrop-blur-xl md:h-16 md:px-5">
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-haze-cyan/40"
            aria-label="返回 Fate Fork 首页"
          >
            <span className="relative grid size-8 place-items-center rounded-full border border-white/10 bg-white/[.05]">
              <span className="size-2 rounded-full bg-gradient-to-br from-haze-cyan to-haze-purple shadow-[0_0_15px_rgba(155,198,201,.55)]" />
              <span className="absolute inset-1 animate-[spin_18s_linear_infinite] rounded-full border border-dashed border-white/15" />
            </span>
            <span>
              <span className="block text-[13px] font-medium tracking-[.18em] text-mist-100">
                FATE FORK
              </span>
              <span className="block text-[9px] tracking-[.28em] text-mist-500">
                命运岔途
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="主要导航">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs tracking-wide text-mist-400 transition duration-500 hover:bg-white/[.05] hover:text-mist-100",
                    isActive && "bg-white/[.065] text-mist-100",
                  )
                }
              >
                <Icon className="size-3.5" strokeWidth={1.5} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {location.pathname !== "/" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="hidden sm:inline-flex"
              >
                <ChevronLeft className="size-3.5" />
                返回
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? "关闭导航" : "打开导航"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
              className="mx-auto mt-2 grid max-w-[1400px] gap-1 rounded-2xl border border-white/[.08] bg-space-950/90 p-2 shadow-glass backdrop-blur-xl lg:hidden"
              aria-label="移动端导航"
            >
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-mist-300",
                      isActive && "bg-white/[.07] text-white",
                    )
                  }
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{
            duration: reduceMotion ? 0 : 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 min-h-screen outline-none"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
