import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export type GlassMode = 'liquid' | 'frosted';

/** Решение по возможности системы, а не по Platform.OS (BR-11). */
export function detectGlassMode(reduceTransparency: boolean): GlassMode {
  if (reduceTransparency) return 'frosted';
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable() ? 'liquid' : 'frosted';
  } catch {
    return 'frosted';
  }
}
