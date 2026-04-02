'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'es';

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'en', toggle: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('feminsight_lang') as Lang | null;
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);

  function toggle() {
    setLang((prev) => {
      const next = prev === 'en' ? 'es' : 'en';
      localStorage.setItem('feminsight_lang', next);
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
