import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReduceTransparency } from '@/lib/useReduceTransparency';
import type { ThemeName } from '@/features/weather/types';
import { detectGlassMode, type GlassMode } from './glassMode';
import { colors, shadow, type Palette, type Shadow } from './tokens';

export interface ThemeValue {
  name: ThemeName;
  c: Palette;
  shadow: Shadow;
  glass: GlassMode;
}

const GlassModeContext = createContext<GlassMode>('frosted');
const ThemeContext = createContext<ThemeValue | null>(null);

/** Один раз на приложение: режим стекла зависит от системы и «Уменьшения прозрачности». */
export function GlassModeProvider({ children }: { children: ReactNode }) {
  const reduceTransparency = useReduceTransparency();
  const mode = useMemo(() => detectGlassMode(reduceTransparency), [reduceTransparency]);
  return <GlassModeContext.Provider value={mode}>{children}</GlassModeContext.Provider>;
}

export function ThemeProvider({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  const glass = useContext(GlassModeContext);
  const value = useMemo<ThemeValue>(() => {
    const base: Palette = { ...colors[theme] };
    if (glass === 'frosted') {
      base.glassFill = base.glassFrosted;
      base.glassEdge = base.glassEdgeFrosted;
      base.glassEdgeSoft = base.glassEdgeFrosted;
    }
    return { name: theme, c: base, shadow: shadow[theme], glass };
  }, [theme, glass]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme вне ThemeProvider');
  return v;
}
