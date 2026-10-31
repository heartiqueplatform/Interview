import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../lib/types';
import { getInitialTheme, applyTheme } from '../lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    const resolved = applyTheme(nextTheme);
    setResolvedTheme(resolved);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
