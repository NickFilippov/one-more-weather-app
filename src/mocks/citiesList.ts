import type { CityCardVM } from '@/features/weather/types';

// Данные макета Cities.dc.html как view-модели: тема экрана night, у карточек своя.

function withCardA11y(items: Omit<CityCardVM, 'a11y'>[]): CityCardVM[] {
  return items.map((c) => ({ ...c, a11y: `${c.name}, ${c.temp}, ${c.label.toLowerCase()}` }));
}

export const citiesList: CityCardVM[] = withCardA11y([
  { id: 'msk', name: 'Москва', sub: 'Моё местоположение · 14:05', theme: 'day', sky: 'rain', label: 'Небольшой дождь', temp: '8°', range: 'Макс. 9° · мин. 4°' },
  { id: 'spb', name: 'Санкт-Петербург', sub: '14:05', theme: 'day', sky: 'clouds', label: 'Облачно', temp: '6°', range: 'Макс. 7° · мин. 2°' },
  { id: 'sochi', name: 'Сочи', sub: '14:05', theme: 'day', sky: 'storm', label: 'Гроза', temp: '15°', range: 'Макс. 17° · мин. 11°' },
  { id: 'kzn', name: 'Казань', sub: '14:05', theme: 'day', sky: 'clear', label: 'Ясно', temp: '5°', range: 'Макс. 6° · мин. −1°' },
  { id: 'nsk', name: 'Новосибирск', sub: '18:05', theme: 'night', sky: 'clear', label: 'Ясно', temp: '−2°', range: 'Макс. 1° · мин. −6°' },
  { id: 'vvo', name: 'Владивосток', sub: '21:05', theme: 'night', sky: 'partly', label: 'Малооблачно', temp: '4°', range: 'Макс. 8° · мин. 1°' },
]);
