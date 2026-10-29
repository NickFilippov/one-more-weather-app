import { ru } from '@/i18n/ru';
import { formatHour, formatTemp } from '@/lib/format';
import { cityClock } from '@/lib/time';
import type { Forecast, HourPoint } from '../types';
import { isPrecipitation, precipKind, type PrecipKind } from './conditions';
import { upcomingHours } from './hours';

const wet = (h: HourPoint): boolean => isPrecipitation(h.code) || (h.precipitation ?? 0) >= 0.1;

function firstSentence(f: Forecast, points: HourPoint[]): string {
  const off = f.utcOffsetSeconds;
  const hh = (h: HourPoint) => formatHour(cityClock(h.time, off));
  const nowKind = precipKind(f.current.code);
  const later = points.slice(1);

  if (nowKind) {
    const dry = later.find((h) => !wet(h));
    const kind = ru.precipKind[nowKind].nominative;
    return dry ? ru.summary.ends(kind, hh(dry)) : ru.summary.endless(kind);
  }
  const first = later.find(wet);
  if (!first) return ru.summary.dry;
  const kind: PrecipKind = precipKind(first.code) ?? 'rain';
  return ru.summary.starts(hh(first), ru.precipKind[kind].lower);
}

function secondSentence(f: Forecast, points: HourPoint[]): string | null {
  const off = f.utcOffsetSeconds;
  const localHour = (h: HourPoint) => cityClock(h.time, off).getUTCHours();
  // Первая точка — текущий час: берём текущую температуру.
  const temps = points.map((h, i) => ({ hour: localHour(h), temp: i === 0 ? f.current.temp : h.temp }));

  if (f.current.isDay) {
    const night = temps.filter((t) => t.hour >= 0 && t.hour <= 6 && t.temp != null).map((t) => t.temp as number);
    return night.length ? ru.summary.night(formatTemp(Math.min(...night))) : null;
  }
  // Ночь: до 7:00 или до первого светлого часа, не дальше 12 часов вперёд.
  const rest: number[] = [];
  for (let i = 0; i < Math.min(temps.length, 12); i++) {
    if (i > 0 && (temps[i].hour === 7 || points[i].isDay)) break;
    const t = temps[i].temp;
    if (t != null) rest.push(t);
  }
  return rest.length ? ru.summary.morning(formatTemp(Math.min(...rest))) : null;
}

/** Предложение (BR-15, Q-14): шаблоны по осадкам и ночной температуре. */
export function buildSummary(f: Forecast): string {
  const points = upcomingHours(f);
  const parts = [firstSentence(f, points), secondSentence(f, points)].filter((s): s is string => !!s);
  return parts.join(' ');
}

