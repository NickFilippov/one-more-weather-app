import { ru } from '@/i18n/ru';
import { formatClock, formatHour, formatPercent, formatRangeCard, formatTemp, formatWeekday, plural, roundTemp } from '@/lib/format';
import { cityClock } from '@/lib/time';
import type { City } from '@/features/cities/types';
import type { CityCardVM, DayVM, Forecast, HeroVM, HourVM, MainVM, ThemeName } from '../types';
import { iconFor, labelFor, skyFor } from './conditions';
import { currentHourIndex } from './hours';
import { buildSummary } from './summary';
import { buildTiles } from './tiles';

const lower = (s: string) => s.toLowerCase();

function popText(pop: number | undefined): string {
  return pop ? `, вероятность осадков ${formatPercent(pop)}` : '';
}

export function themeOf(f: Forecast): ThemeName {
  return f.current.isDay ? 'day' : 'night';
}

/** Температура сейчас и диапазон дня: диапазон расширяется, чтобы текущая температура в него попала. */
function buildHero(city: Pick<City, 'name'>, f: Forecast): HeroVM {
  const temp = roundTemp(f.current.temp);
  const today = f.daily[0];
  const high = today?.max != null ? Math.max(roundTemp(today.max), temp) : temp;
  const low = today?.min != null ? Math.min(roundTemp(today.min), temp) : temp;
  return { place: city.name, temp, condition: labelFor(f.current.code), high, low };
}

/**
 * Прогноз свежий до 30 минут, а страница открыта дольше: ленту и сводку считаем от настоящего «сейчас»,
 * а не от времени снимка `current.time`. Иначе текущий час повторяется в ленте, а сводка говорит
 * «около 17:00 начнётся дождь», когда 17:00 уже прошло.
 */
function atNow(f: Forecast, now: number): Forecast {
  return now > f.current.time ? { ...f, current: { ...f.current, time: now } } : f;
}

export function buildMainVM(city: Pick<City, 'name'>, forecast: Forecast, now: number): MainVM {
  const f = atNow(forecast, now);
  const off = f.utcOffsetSeconds;
  const hero = buildHero(city, f);
  const { temp, high, low, condition } = hero;

  // Лента: текущий час из current, дальше 24 часа вперёд.
  const i0 = currentHourIndex(f);
  const nowPop = f.hourly[i0]?.pop;
  const nowIcon = iconFor(f.current.code, f.current.isDay);
  const nowPopValue = nowPop && nowPop > 0 ? Math.round(nowPop) : undefined;
  const hours: HourVM[] = [
    {
      now: true,
      icon: nowIcon,
      temp,
      ...(nowPopValue ? { pop: nowPopValue } : null),
      a11y: `${ru.now}, ${formatTemp(temp)}, ${lower(condition)}${popText(nowPopValue)}`,
    },
  ];
  for (const h of f.hourly.slice(i0 + 1, i0 + 25)) {
    if (h.temp == null) continue;
    const clock = cityClock(h.time, off);
    const t = roundTemp(h.temp);
    const pop = h.pop && h.pop > 0 ? Math.round(h.pop) : undefined;
    const hourNumber = clock.getUTCHours();
    hours.push({
      time: formatHour(clock),
      icon: iconFor(h.code, h.isDay),
      temp: t,
      ...(pop ? { pop } : null),
      a11y: `${hourNumber} ${plural(hourNumber, 'час', 'часа', 'часов')}, ${formatTemp(t)}, ${lower(labelFor(h.code))}${popText(pop)}`,
    });
  }

  // 10 дней. У сегодняшнего диапазон берётся из шапки, чтобы точка «сейчас» не вылезла за полоску.
  const days: DayVM[] = [];
  f.daily.forEach((d, i) => {
    if (d.min == null || d.max == null) return;
    const isToday = i === 0;
    const dayLow = isToday ? low : roundTemp(d.min);
    const dayHigh = isToday ? high : roundTemp(d.max);
    const name = formatWeekday(cityClock(d.date, off), i);
    const pop = d.pop && d.pop > 0 ? Math.round(d.pop) : undefined;
    const icon = iconFor(d.code, true);
    days.push({
      day: name,
      icon,
      low: dayLow,
      high: dayHigh,
      ...(pop ? { pop } : null),
      ...(isToday ? { now: temp } : null),
      a11y: `${name}, от ${formatTemp(dayLow)} до ${formatTemp(dayHigh)}, ${lower(labelFor(d.code))}${popText(pop)}`,
    });
  });

  return {
    theme: themeOf(f),
    sky: skyFor(f.current.code),
    hero,
    summary: buildSummary(f),
    hours,
    days,
    dayMin: days.length ? Math.min(...days.map((d) => d.low)) : temp,
    dayMax: days.length ? Math.max(...days.map((d) => d.high)) : temp,
    tiles: buildTiles(f, now),
    updatedAt: formatClock(cityClock(Math.floor(f.fetchedAt / 1000), off)),
  };
}

/**
 * Карточка в списке городов. `now` — Unix-секунды, от него местное время в подписи (FR-20).
 * Без прогноза: прочерк и «Загрузка…» или «Нет данных» (`failed`), небо ночное облачное.
 */
export function buildCityCardVM(city: City, f: Forecast | undefined, now: number, failed = false): CityCardVM {
  const clock = f ? formatClock(cityClock(now, f.utcOffsetSeconds)) : '';
  const sub = city.isCurrentLocation ? [ru.cities.myLocation, clock].filter(Boolean).join(' · ') : clock;
  if (!f) {
    const label = failed ? ru.placeholder.noData : ru.placeholder.loading;
    return { id: city.id, theme: 'night', sky: 'clouds', name: city.name, sub, temp: '—', label, range: '', a11y: `${city.name}, ${lower(label)}` };
  }
  const hero = buildHero(city, f);
  const temp = formatTemp(hero.temp);
  return {
    id: city.id,
    theme: themeOf(f),
    sky: skyFor(f.current.code),
    name: city.name,
    sub,
    temp,
    label: hero.condition,
    range: formatRangeCard(hero.high, hero.low),
    a11y: `${city.name}, ${temp}, ${lower(hero.condition)}`,
  };
}
