import { z } from 'zod';
import { ru } from '@/i18n/ru';
import { getJson } from '@/lib/http';
import type { WeatherError } from '@/features/weather/types';
import type { City } from './types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Ничего не найдено: поля results нет вовсе. Пустые поля в ответ не попадают.
export const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        feature_code: z.string().optional(),
        country_code: z.string().optional(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export interface SearchResult {
  city: City;
  /** «Краснодарский край, Россия»; у аэропорта впереди «Аэропорт · » (Q-08). */
  sub: string;
}

export type SearchCitiesResult = { ok: true; data: SearchResult[] } | { ok: false; error: WeatherError };

export function geocodingUrl(query: string): string {
  const q = new URLSearchParams({ name: query, count: '10', language: 'ru', format: 'json' });
  return `${GEOCODING_URL}?${q.toString()}`;
}

/** Города и аэропорты (по коду IATA) по названию. Никогда не бросает. */
export async function searchCities(query: string): Promise<SearchCitiesResult> {
  const res = await getJson(geocodingUrl(query));
  if (!res.ok) return res;
  const parsed = geocodingSchema.safeParse(res.data);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')).join(', ') } };
  }
  // PCL* — страны и зависимые территории: погода нужна городу, а не стране
  const places = (parsed.data.results ?? []).filter((r) => !r.feature_code?.startsWith('PCL'));
  const data = places.map((r) => {
    const place = [r.admin1, r.country].filter(Boolean).join(', ');
    return {
      city: {
        id: `geo:${r.id}`,
        name: r.name,
        region: r.admin1,
        country: r.country,
        latitude: r.latitude,
        longitude: r.longitude,
        isCurrentLocation: false,
      },
      sub: r.feature_code === 'AIRP' ? [ru.cities.airport, place].filter(Boolean).join(' · ') : place,
    };
  });
  return { ok: true, data };
}
