import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City } from '@/features/cities/types';
import { persistStorage } from '@/lib/storage';
import { fetchForecast } from './api';
import { mapForecast } from './model/mapForecast';
import type { Forecast, WeatherError } from './types';

export const FRESH_MS = 30 * 60 * 1000; // NFR-07
const MAX_PARALLEL = 4;

type Status = 'idle' | 'loading' | 'error';
interface RefreshOptions {
  force?: boolean;
}

interface WeatherState {
  entries: Record<string, Forecast>; // ключ — City.id
  status: Record<string, Status>;
  error: Record<string, WeatherError | undefined>;
  refresh(city: City, opts?: RefreshOptions): Promise<void>;
  refreshAll(cities: City[], opts?: RefreshOptions): Promise<void>;
}

// Запросы в полёте: повторный refresh города получает тот же промис.
const inflight = new Map<string, Promise<void>>();

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      entries: {},
      status: {},
      error: {},

      refresh(city, opts) {
        const existing = inflight.get(city.id);
        if (existing) return existing;

        const entry = get().entries[city.id];
        if (!opts?.force && entry && Date.now() - entry.fetchedAt < FRESH_MS) return Promise.resolve();

        set((s) => ({ status: { ...s.status, [city.id]: 'loading' }, error: { ...s.error, [city.id]: undefined } }));
        const job = (async () => {
          try {
            const res = await fetchForecast(city.latitude, city.longitude);
            if (res.ok) {
              const forecast = mapForecast(res.data, Date.now());
              set((s) => ({
                entries: { ...s.entries, [city.id]: forecast },
                status: { ...s.status, [city.id]: 'idle' },
                error: { ...s.error, [city.id]: undefined },
              }));
            } else {
              // Ошибка не стирает старые данные (NFR-08).
              set((s) => ({
                status: { ...s.status, [city.id]: 'error' },
                error: { ...s.error, [city.id]: res.error },
              }));
            }
          } finally {
            inflight.delete(city.id);
          }
        })();
        inflight.set(city.id, job);
        return job;
      },

      async refreshAll(cities, opts) {
        const queue = [...cities];
        const worker = async () => {
          for (let c = queue.shift(); c; c = queue.shift()) await get().refresh(c, opts);
        };
        await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, worker));
      },
    }),
    {
      name: 'weather-v1',
      version: 1,
      storage: persistStorage,
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);
