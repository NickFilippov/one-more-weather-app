import { useCallback, useSyncExternalStore } from 'react';

const currentMinute = (): number => Math.floor(Date.now() / 60000);

/** Номер минуты Unix-времени; пока enabled, перечитывается раз в минуту. Нужен, чтобы пересчитывать «сейчас». */
export function useMinuteTick(enabled: boolean): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!enabled) return () => {};
      const id = setInterval(onChange, 60000);
      return () => clearInterval(id);
    },
    [enabled],
  );
  return useSyncExternalStore(subscribe, currentMinute);
}
