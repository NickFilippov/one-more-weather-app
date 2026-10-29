import { useEffect } from 'react';
import { AppState } from 'react-native';
import { selectPages, useCitiesStore } from '@/features/cities/citiesStore';
import { useWeatherStore } from './weatherStore';

/** При запуске и возврате в приложение. Свежие города (до 30 минут) store пропускает сам. */
export function useWeatherAutoRefresh(): void {
  useEffect(() => {
    const run = () => {
      const pages = selectPages(useCitiesStore.getState());
      void useWeatherStore.getState().refreshAll(pages);
    };
    const start = () => {
      if (useCitiesStore.persist.hasHydrated() && useWeatherStore.persist.hasHydrated()) run();
    };
    start();
    const unsubs = [useCitiesStore.persist.onFinishHydration(start), useWeatherStore.persist.onFinishHydration(start)];
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => {
      sub.remove();
      unsubs.forEach((u) => u());
    };
  }, []);
}
