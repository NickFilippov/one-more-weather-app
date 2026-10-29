import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ThemeName } from '@/features/weather/types';
import { colors, type Palette } from './tokens';

export interface ThemeValue {
  name: ThemeName;
  c: Palette;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Цвета дня или ночи для поддерева: у каждой страницы города и карточки своя тема. */
export function ThemeProvider({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  const value = useMemo<ThemeValue>(() => ({ name: theme, c: colors[theme] }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme вне ThemeProvider');
  return v;
}
