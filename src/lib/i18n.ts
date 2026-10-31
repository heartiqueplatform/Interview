import en from '../i18n/en.json';
import sw from '../i18n/sw.json';
import type { Language } from './types';

export const dictionaries = { en, sw };

export function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
  const dict = dictionaries[lang] || dictionaries.en;
  let text = getNestedValue(dict as unknown as Record<string, unknown>, key);
  if (text === key && lang !== 'en') {
    text = getNestedValue(dictionaries.en as unknown as Record<string, unknown>, key);
  }
  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }
  return text;
}
