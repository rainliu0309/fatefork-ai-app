/* Context providers intentionally export their paired hook and storage helper. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyInterfaceLocale } from "@/lib/interfaceTranslations";

export type AppLocale = "zh-CN" | "en";

const LOCALE_STORAGE_KEY = "fatefork.locale";

export function getStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "zh-CN";
  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "en" ? "en" : "zh-CN";
}

type LocaleContextValue = {
  locale: AppLocale;
  isEnglish: boolean;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Device-local language preference for interface copy and AIGC output. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(getStoredLocale);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    return applyInterfaceLocale(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      isEnglish: locale === "en",
      toggleLocale: () => setLocale((current) => (current === "zh-CN" ? "en" : "zh-CN")),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider.");
  return value;
}
