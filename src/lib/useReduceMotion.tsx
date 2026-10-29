import { createContext, useContext, type ReactNode } from 'react';
import { useAccessibilityFlag } from './useAccessibilityFlag';

const ReduceMotionContext = createContext(false);

/** Одна подписка на «Уменьшение движения» на всё приложение. */
export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const reduce = useAccessibilityFlag('reduceMotion');
  return <ReduceMotionContext.Provider value={reduce}>{children}</ReduceMotionContext.Provider>;
}

export const useReduceMotion = (): boolean => useContext(ReduceMotionContext);
