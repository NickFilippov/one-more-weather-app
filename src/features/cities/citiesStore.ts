import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/lib/storage';
import type { City } from './types';

export type LocationPermission = 'unknown' | 'granted' | 'denied';

interface CitiesState {
  currentLocation: City | null; // город по геолокации, всегда первая страница
  saved: City[]; // добавленные пользователем, в порядке списка
  locationPermission: LocationPermission;
  addCity(city: City): 'added' | 'duplicate';
  setCurrentLocation(city: City | null): void;
  setLocationPermission(p: LocationPermission): void;
}

export const useCitiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      saved: [],
      locationPermission: 'unknown',
      addCity(city) {
        const { saved, currentLocation } = get();
        if (saved.some((c) => c.id === city.id) || currentLocation?.id === city.id) return 'duplicate';
        set({ saved: [...saved, city] });
        return 'added';
      },
      setCurrentLocation: (city) => set({ currentLocation: city }),
      setLocationPermission: (p) => set({ locationPermission: p }),
    }),
    {
      name: 'cities-v1',
      version: 1,
      storage: persistStorage,
      partialize: (s) => ({
        currentLocation: s.currentLocation,
        saved: s.saved,
        locationPermission: s.locationPermission,
      }),
    },
  ),
);

/** Страницы главного экрана: местоположение первым, дальше сохранённые. */
export const selectPages = (s: Pick<CitiesState, 'currentLocation' | 'saved'>): City[] =>
  s.currentLocation ? [s.currentLocation, ...s.saved] : s.saved;
