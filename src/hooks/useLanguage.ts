import { useState, useCallback, useEffect } from 'react';
import type { Language } from '../lib/types';
import { translate } from '../lib/i18n';

const LANG_KEY = 'boardpass_lang';

export function useLanguage(initialLang: Language = 'en') {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return initialLang;
    const saved = localStorage.getItem(LANG_KEY) as Language | null;
    return saved === 'sw' ? 'sw' : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  return { language, setLanguage, t };
}
