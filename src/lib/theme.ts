import type { Theme } from './types';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem('boardpass_theme') as Theme | null;
  return saved || 'system';
}

export function applyTheme(theme: Theme): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark';
  let resolved: 'light' | 'dark' = 'dark';
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }
  document.documentElement.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('boardpass_theme', theme);
  return resolved;
}
