import { ru } from '@/i18n/ru';
import { formatPercent, formatTemp } from '@/lib/format';
import type { DayVM, HourVM, MainVM } from '@/features/weather/types';

// Данные макетов (Main, Night, Storm) как view-модели. Нужны тестам и для сверки с макетами.

const pop = (p?: number) => (p ? `, вероятность осадков ${formatPercent(p)}` : '');

function hoursWithA11y(items: Omit<HourVM, 'a11y'>[]): HourVM[] {
  return items.map((h) => ({
    ...h,
    a11y: `${h.now ? ru.now : `${h.time} ч`}, ${formatTemp(h.temp)}${pop(h.pop)}`,
  }));
}

function daysWithA11y(items: Omit<DayVM, 'a11y'>[]): DayVM[] {
  return items.map((d) => ({
    ...d,
    a11y: `${d.day}, от ${formatTemp(d.low)} до ${formatTemp(d.high)}${pop(d.pop)}`,
  }));
}

// Москва, день, дождь (Main.dc.html)
export const moscowRain: MainVM = {
  theme: 'day',
  sky: 'rain',
  hero: { place: 'Москва', temp: 8, condition: 'Небольшой дождь', high: 9, low: 4 },
  summary: 'Дождь закончится около 17:00. Ночью без осадков, до 4°.',
  hours: hoursWithA11y([
    { now: true, icon: 'rain', pop: 60, temp: 8 },
    { time: '15', icon: 'rain', pop: 70, temp: 8 },
    { time: '16', icon: 'rain', pop: 55, temp: 8 },
    { time: '17', icon: 'cloud', pop: 30, temp: 7 },
    { time: '18', icon: 'cloud', temp: 6 },
    { time: '19', icon: 'cloud', temp: 6 },
    { time: '20', icon: 'moon', temp: 5 },
    { time: '21', icon: 'moon', temp: 5 },
    { time: '22', icon: 'moon', temp: 4 },
    { time: '23', icon: 'moon', temp: 4 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'rain', pop: 70, low: 4, high: 9, now: 8 },
    { day: 'Вт', icon: 'cloud', low: 3, high: 8 },
    { day: 'Ср', icon: 'rain', pop: 40, low: 2, high: 7 },
    { day: 'Чт', icon: 'partly', low: 1, high: 6 },
    { day: 'Пт', icon: 'sun', low: -1, high: 5 },
    { day: 'Сб', icon: 'snow', pop: 30, low: -3, high: 2 },
    { day: 'Вс', icon: 'cloud', low: -2, high: 3 },
    { day: 'Пн', icon: 'partly', low: -1, high: 4 },
    { day: 'Вт', icon: 'cloud', low: 0, high: 5 },
    { day: 'Ср', icon: 'rain', pop: 50, low: 2, high: 6 },
  ]),
  dayMin: -3,
  dayMax: 9,
  tiles: [
    { key: 'feelsLike', label: 'Ощущается как', value: '5°', note: 'Из-за ветра кажется холоднее.' },
    { key: 'wind', label: 'Ветер', value: '6', unit: 'м/с', note: 'Северо-западный, порывы до 11 м/с.' },
  ],
  updatedAt: '14:05',
};

// Санкт-Петербург, ночь, ясно (Night.dc.html)
export const spbNight: MainVM = {
  theme: 'night',
  sky: 'clear',
  hero: { place: 'Санкт-Петербург', temp: 3, condition: 'Ясно', high: 7, low: -1 },
  summary: 'Ясно до утра. К 6:00 похолодает до −1°, возможен гололёд.',
  hours: hoursWithA11y([
    { now: true, icon: 'moon', temp: 3 },
    { time: '23', icon: 'moon', temp: 2 },
    { time: '00', icon: 'moon', temp: 2 },
    { time: '01', icon: 'moon', temp: 1 },
    { time: '02', icon: 'moon', temp: 1 },
    { time: '03', icon: 'moon', temp: 0 },
    { time: '04', icon: 'moon', temp: 0 },
    { time: '05', icon: 'moon', temp: -1 },
    { time: '06', icon: 'moon', temp: -1 },
    { time: '07', icon: 'cloud', temp: -1 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'partly', low: -1, high: 7, now: 3 },
    { day: 'Вт', icon: 'sun', low: -2, high: 6 },
    { day: 'Ср', icon: 'cloud', low: 0, high: 5 },
    { day: 'Чт', icon: 'rain', pop: 60, low: 2, high: 6 },
    { day: 'Пт', icon: 'rain', pop: 80, low: 3, high: 7 },
    { day: 'Сб', icon: 'storm', pop: 70, low: 2, high: 5 },
    { day: 'Вс', icon: 'cloud', low: 0, high: 4 },
    { day: 'Пн', icon: 'snow', pop: 40, low: -3, high: 1 },
    { day: 'Вт', icon: 'partly', low: -4, high: 0 },
    { day: 'Ср', icon: 'sun', low: -5, high: -1 },
  ]),
  dayMin: -5,
  dayMax: 7,
  tiles: [
    { key: 'sunrise', label: 'Восход', value: '8:52', note: 'Закат в 16:29.' },
    { key: 'humidity', label: 'Влажность', value: '86%', note: 'Точка росы 1°.' },
  ],
  updatedAt: '22:05',
};

// Сочи, ночь, гроза (Storm.dc.html), без панели предупреждения
export const sochiStorm: MainVM = {
  theme: 'night',
  sky: 'storm',
  hero: { place: 'Сочи', temp: 14, condition: 'Гроза', high: 17, low: 11 },
  summary: 'Гроза стихнет к часу ночи, дождь продлится до утра.',
  hours: hoursWithA11y([
    { now: true, icon: 'storm', pop: 90, temp: 14 },
    { time: '23', icon: 'storm', pop: 85, temp: 14 },
    { time: '00', icon: 'storm', pop: 75, temp: 13 },
    { time: '01', icon: 'rain', pop: 70, temp: 13 },
    { time: '02', icon: 'rain', pop: 60, temp: 12 },
    { time: '03', icon: 'rain', pop: 45, temp: 12 },
    { time: '04', icon: 'cloud', pop: 30, temp: 12 },
    { time: '05', icon: 'cloud', temp: 11 },
    { time: '06', icon: 'cloud', temp: 11 },
    { time: '07', icon: 'partly', temp: 12 },
  ]),
  days: daysWithA11y([
    { day: 'Сегодня', icon: 'storm', pop: 90, low: 11, high: 17, now: 14 },
    { day: 'Вт', icon: 'rain', pop: 60, low: 11, high: 16 },
    { day: 'Ср', icon: 'partly', low: 10, high: 17 },
    { day: 'Чт', icon: 'sun', low: 9, high: 18 },
    { day: 'Пт', icon: 'sun', low: 10, high: 19 },
    { day: 'Сб', icon: 'partly', low: 11, high: 18 },
    { day: 'Вс', icon: 'rain', pop: 50, low: 12, high: 17 },
    { day: 'Пн', icon: 'cloud', low: 11, high: 16 },
    { day: 'Вт', icon: 'sun', low: 9, high: 17 },
    { day: 'Ср', icon: 'sun', low: 10, high: 18 },
  ]),
  dayMin: 9,
  dayMax: 19,
  tiles: [
    { key: 'precipitation', label: 'Осадки', value: '18', unit: 'мм', note: 'За 3 часа. Ещё 9 мм до утра.' },
    { key: 'wind', label: 'Ветер', value: '9', unit: 'м/с', note: 'С моря, порывы до 17 м/с.' },
  ],
  updatedAt: '22:05',
};
