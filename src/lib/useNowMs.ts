import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Текущее время, мс: на момент монтирования и при каждом возвращении в приложение. Раз в минуту не тикает. */
export function useNowMs(): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => sub.remove();
  }, []);
  return now;
}
