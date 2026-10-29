import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

type Flag = 'reduceMotion' | 'reduceTransparency';

// Не на всех платформах есть оба метода (в react-native-web нет isReduceTransparencyEnabled):
// отсутствующая возможность считается выключенной.
const query: Record<Flag, () => Promise<boolean>> = {
  reduceMotion: () => AccessibilityInfo.isReduceMotionEnabled(),
  reduceTransparency: () => AccessibilityInfo.isReduceTransparencyEnabled(),
};
const event = {
  reduceMotion: 'reduceMotionChanged',
  reduceTransparency: 'reduceTransparencyChanged',
} as const;

export function useAccessibilityFlag(flag: Flag): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    let alive = true;
    try {
      query[flag]()
        .then((v) => alive && setValue(v))
        .catch(() => {});
    } catch {
      /* метод не реализован */
    }
    let remove: (() => void) | undefined;
    try {
      remove = AccessibilityInfo.addEventListener(event[flag], setValue)?.remove;
    } catch {
      /* событие не поддерживается */
    }
    return () => {
      alive = false;
      remove?.();
    };
  }, [flag]);
  return value;
}
