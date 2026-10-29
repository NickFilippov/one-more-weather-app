import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { searchCities, type SearchCitiesResult, type SearchResult } from './geocodingApi';

// Одна буква не ищет ничего, две — точное совпадение (docs/tech/02, Geocoding)
export const MIN_QUERY = 2;
export const DEBOUNCE_MS = 300;

export interface CitySearch {
  status: 'idle' | 'loading' | 'done' | 'error';
  results: SearchResult[];
}

/**
 * Поиск по мере набора: trim, задержка 300 мс, от двух символов.
 * Пока ответ на текущий текст не пришёл, остаются прошлые результаты со статусом loading.
 * Ответ на устаревший запрос отбрасывается.
 */
export function useCitySearch(text: string): CitySearch {
  const query = text.trim();
  const debounced = useDebouncedValue(query, DEBOUNCE_MS);
  const [last, setLast] = useState<{ query: string; result: SearchCitiesResult } | null>(null);

  useEffect(() => {
    if (debounced.length < MIN_QUERY) return;
    let stale = false;
    void searchCities(debounced).then((result) => {
      if (!stale) setLast({ query: debounced, result });
    });
    return () => {
      stale = true;
    };
  }, [debounced]);

  if (query.length < MIN_QUERY) return { status: 'idle', results: [] };
  if (last?.query !== query) return { status: 'loading', results: last?.result.ok ? last.result.data : [] };
  return last.result.ok ? { status: 'done', results: last.result.data } : { status: 'error', results: [] };
}
