import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { ru } from '@/i18n/ru';
import { useCitiesStore } from './citiesStore';
import { searchCities } from './geocodingApi';
import type { City } from './types';

export const CURRENT_LOCATION_ID = 'current-location';

const LAST_KNOWN_MAX_AGE = 30 * 60 * 1000;
// Нет источника координат (спутников не видно, сети нет): без предела определение ждало бы вечно
const LOW_TIMEOUT = 8 * 1000;
const HIGH_TIMEOUT = 20 * 1000;
// reverseGeocodeAsync ограничен по частоте: название переспрашивается, только если место заметно сменилось
const RENAME_DELTA = 0.05;

export type LocateStatus = 'idle' | 'locating' | 'error';

/** Идёт ли определение и чем кончилось последнее. Не сохраняется. */
export const useLocateStatus = create<{ status: LocateStatus }>(() => ({ status: 'idle' }));

const setStatus = (status: LocateStatus) => useLocateStatus.setState({ status });
// Координаты округляются до 0.01 (около 1 км): точнее для погоды не нужно (NFR-14)
const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Геокодер ОС отвечает на языке телефона («Moskva» на Android с английским). Русское название берём
 * из поиска Open-Meteo: ближайший к координатам результат. Нет такого или поиск не ответил — как есть.
 */
async function inRussian(name: string, latitude: number, longitude: number): Promise<string> {
  if (!/[A-Za-z]/.test(name)) return name;
  const res = await searchCities(name);
  if (!res.ok) return name;
  const near = res.data
    .map((r) => ({ r, d: Math.abs(r.city.latitude - latitude) + Math.abs(r.city.longitude - longitude) }))
    .filter((x) => x.d < 1)
    .sort((a, b) => a.d - b.d)[0];
  return near?.r.city.name ?? name;
}

async function placeName(latitude: number, longitude: number, prev: City | null): Promise<string> {
  const near =
    prev &&
    prev.name !== ru.cities.myLocation &&
    Math.abs(prev.latitude - latitude) <= RENAME_DELTA &&
    Math.abs(prev.longitude - longitude) <= RENAME_DELTA;
  if (near) return prev.name;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const name = place?.city ?? place?.subregion ?? place?.region;
    return name ? await inRussian(name, latitude, longitude) : ru.cities.myLocation;
  } catch {
    // геокодер ОС недоступен или упёрся в лимит: остаётся запасное название
    return ru.cities.myLocation;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('location timeout')), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Недавняя позиция, иначе грубая: ~1 км по сети хватает для погоды (NFR-14). Если сеть места не дала
 * (нет сетевых источников, как на эмуляторе Android, или они выключены), один раз просим GPS.
 */
async function currentPosition(): Promise<Location.LocationObject> {
  const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE });
  if (last) return last;
  try {
    return await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }), LOW_TIMEOUT);
  } catch {
    return withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }), HIGH_TIMEOUT);
  }
}

let job: Promise<void> | null = null;

/** Координаты устройства → город «Моё местоположение» и его погода. Разрешение уже должно быть. */
function locate(): Promise<void> {
  if (job) return job;
  job = (async () => {
    setStatus('locating');
    try {
      const pos = await currentPosition();
      const latitude = round2(pos.coords.latitude);
      const longitude = round2(pos.coords.longitude);
      const prev = useCitiesStore.getState().currentLocation;
      const moved = !prev || prev.latitude !== latitude || prev.longitude !== longitude;
      const city: City = {
        id: CURRENT_LOCATION_ID,
        name: await placeName(latitude, longitude, prev),
        latitude,
        longitude,
        isCurrentLocation: true,
      };
      useCitiesStore.getState().setCurrentLocation(city);
      setStatus('idle');
      void useWeatherStore.getState().refresh(city, { force: moved });
    } catch {
      // геолокация выключена в системе или ОС не дала координаты
      setStatus('error');
    } finally {
      job = null;
    }
  })();
  return job;
}

/** По нажатию «Определить местоположение»: системный запрос доступа, затем определение. */
export async function requestAndLocate(): Promise<void> {
  const { setLocationPermission } = useCitiesStore.getState();
  setStatus('locating');
  let status: Location.PermissionStatus;
  try {
    ({ status } = await Location.requestForegroundPermissionsAsync());
  } catch {
    setStatus('error');
    return;
  }
  if (status !== 'granted') {
    setLocationPermission('denied');
    setStatus('idle');
    return;
  }
  setLocationPermission('granted');
  await locate();
}

/**
 * При запуске и возврате в приложение. Сам доступ не спрашивает (NFR-14): только сверяет его с ОС.
 * Доступ дали в настройках — местоположение появляется; забрали — страница местоположения уходит.
 */
export async function refreshLocation(): Promise<void> {
  const { locationPermission, setLocationPermission, setCurrentLocation } = useCitiesStore.getState();
  if (locationPermission === 'unknown') return;
  let status: Location.PermissionStatus;
  try {
    ({ status } = await Location.getForegroundPermissionsAsync());
  } catch {
    return;
  }
  if (status === 'granted') {
    setLocationPermission('granted');
    await locate();
    return;
  }
  setCurrentLocation(null);
  // iOS после «Разрешить один раз» при следующем запуске снова отвечает undetermined: кнопка вернётся
  setLocationPermission(status === 'denied' ? 'denied' : 'unknown');
}

export function useCurrentLocation(): void {
  useEffect(() => {
    const run = () => {
      if (useCitiesStore.persist.hasHydrated()) void refreshLocation();
    };
    run();
    const unsub = useCitiesStore.persist.onFinishHydration(run);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => {
      sub.remove();
      unsub();
    };
  }, []);
}
