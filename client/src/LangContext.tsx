import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { formatDuration, translate, type Lang } from './i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  fmtDur: (sec: number) => string;
}

const Ctx = createContext<LangCtx | null>(null);

const KEY = 'app_lang';

function isLang(v: unknown): v is Lang {
  return v === 'az' || v === 'ru' || v === 'en';
}

function initialLang(): Lang {
  const url = new URLSearchParams(window.location.search).get('lang');
  if (isLang(url)) {
    localStorage.setItem(KEY, url);
    return url;
  }
  const saved = localStorage.getItem(KEY);
  if (isLang(saved)) return saved;
  return 'ru';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang: (l) => {
        localStorage.setItem(KEY, l);
        setLangState(l);
      },
      t: (key, params) => translate(lang, key, params),
      fmtDur: (sec) => formatDuration(sec, lang),
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLang must be used within LangProvider');
  return c;
}
