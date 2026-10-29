import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReduceMotionContext = createContext(false);

/** Одна подписка на «Уменьшение движения» на всё приложение. */
export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return <ReduceMotionContext.Provider value={reduce}>{children}</ReduceMotionContext.Provider>;
}

export const useReduceMotion = (): boolean => useContext(ReduceMotionContext);
