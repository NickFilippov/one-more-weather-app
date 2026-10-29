import { getJson } from '@/lib/http';
import { forecastSchema, type RawForecast } from './schema';
import type { WeatherError } from './types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const FORECAST_PARAMS = {
  current:
    'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
  hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,is_day,dew_point_2m',
  daily:
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset',
  timezone: 'auto',
  forecast_days: '10',
  past_hours: '3',
  forecast_hours: '25',
  wind_speed_unit: 'ms',
  timeformat: 'unixtime',
} as const;

/** Координаты с двумя знаками: около километра, точное место не раскрывается (NFR-14). */
export function forecastUrl(lat: number, lon: number): string {
  const q = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    ...FORECAST_PARAMS,
  });
  return `${FORECAST_URL}?${q.toString()}`;
}

export type ForecastResult = { ok: true; data: RawForecast } | { ok: false; error: WeatherError };

export async function fetchForecast(lat: number, lon: number): Promise<ForecastResult> {
  const res = await getJson(forecastUrl(lat, lon));
  if (!res.ok) return res;
  const parsed = forecastSchema.safeParse(res.data);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')).join(', ') } };
  }
  return { ok: true, data: parsed.data };
}
