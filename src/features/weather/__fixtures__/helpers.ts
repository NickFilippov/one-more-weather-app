import moscow from './forecast-moscow.json';
import sochi from './forecast-sochi.json';
import tromso from './forecast-tromso-polar.json';
import { forecastSchema, type RawForecast } from '../schema';
import { mapForecast } from '../model/mapForecast';
import type { Forecast } from '../types';

export const fixtures = { moscow, sochi, tromso };

export function rawOf(name: keyof typeof fixtures, patch?: (r: RawForecast) => void): RawForecast {
  const r = structuredClone(forecastSchema.parse(fixtures[name]));
  patch?.(r);
  return r;
}

export function forecastOf(name: keyof typeof fixtures, patch?: (r: RawForecast) => void): { f: Forecast; now: number } {
  const raw = rawOf(name, patch);
  return { f: mapForecast(raw, raw.current.time * 1000), now: raw.current.time };
}
