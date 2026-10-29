import { ru } from '@/i18n/ru';
import { formatClock, formatMm, formatPercent, formatTemp, formatWind, roundTemp } from '@/lib/format';
import { cityClock } from '@/lib/time';
import type { Forecast, TileKey, TileVM } from '../types';
import { currentHourIndex } from './hours';
import { skyFor } from './conditions';

const ORDER_RAIN: TileKey[] = ['precipitation', 'wind', 'feelsLike', 'humidity'];
const ORDER_NIGHT: TileKey[] = ['sunrise', 'humidity', 'feelsLike', 'wind'];
const ORDER_DAY: TileKey[] = ['feelsLike', 'wind', 'humidity', 'sunset'];
const FALLBACK: TileKey[] = ['feelsLike', 'wind', 'humidity', 'sunset', 'precipitation'];

const sum = (xs: (number | null)[]): number => xs.reduce<number>((a, x) => a + (x ?? 0), 0);

function windDirection(deg: number): string {
  const idx = Math.floor(((((deg % 360) + 360) % 360) + 22.5) / 45) % 8;
  return ru.wind.directions[idx];
}

/** Первое значение строго после `after` из списка Unix-секунд. */
function firstAfter(list: (number | null)[], after: number): number | null {
  const sorted = list.filter((x): x is number => x != null).sort((a, b) => a - b);
  return sorted.find((x) => x > after) ?? null;
}

export function buildTiles(f: Forecast, now: number): TileVM[] {
  const i0 = currentHourIndex(f);
  const off = f.utcOffsetSeconds;
  const clock = (t: number) => formatClock(cityClock(t, off));
  const sky = skyFor(f.current.code);
  const past3 = sum(f.hourly.slice(Math.max(0, i0 - 3), i0).map((h) => h.precipitation));
  const next12 = sum(f.hourly.slice(i0 + 1, i0 + 13).map((h) => h.precipitation));
  const sunrises = f.daily.map((d) => d.sunrise);
  const sunsets = f.daily.map((d) => d.sunset);

  const make: Record<TileKey, () => TileVM | null> = {
    feelsLike: () => {
      const feels = f.current.feelsLike;
      if (feels == null) return null;
      const d = roundTemp(feels) - roundTemp(f.current.temp);
      const wind = f.current.windSpeed ?? 0;
      const humidity = f.current.humidity ?? 0;
      let note: string = ru.feelsLike.same;
      if (d <= -2) note = wind >= 3 ? ru.feelsLike.colderWind : ru.feelsLike.colder;
      else if (d >= 2) note = humidity >= 60 ? ru.feelsLike.warmerHumid : ru.feelsLike.warmer;
      return { key: 'feelsLike', label: ru.tiles.feelsLike, value: formatTemp(feels), note };
    },
    wind: () => {
      const speed = f.current.windSpeed;
      if (speed == null) return null;
      if (speed < 0.5) return { key: 'wind', label: ru.tiles.wind, value: '0', unit: ru.units.ms, note: ru.wind.calm };
      const dir = f.current.windDirection != null ? windDirection(f.current.windDirection) : null;
      const gusts = f.current.windGusts;
      const hasGusts = gusts != null && Math.round(gusts) > Math.round(speed);
      let note = '';
      if (dir && hasGusts) note = ru.wind.gusts(dir, Math.round(gusts));
      else if (dir) note = ru.wind.plain(dir);
      else if (hasGusts) note = ru.wind.gustsOnly(Math.round(gusts));
      return { key: 'wind', label: ru.tiles.wind, value: formatWind(speed), unit: ru.units.ms, note };
    },
    humidity: () => {
      const h = f.current.humidity;
      if (h == null) return null;
      const dew = f.hourly[i0]?.dewPoint;
      return {
        key: 'humidity',
        label: ru.tiles.humidity,
        value: formatPercent(h),
        note: dew != null ? ru.dewPoint(formatTemp(dew)) : '',
      };
    },
    sunrise: () => {
      if (f.daily.length === 0) return null;
      const t = firstAfter(sunrises, now);
      if (t == null) {
        return { key: 'sunrise', label: ru.tiles.sunrise, value: '—', note: f.current.isDay ? ru.sun.polarDay : ru.sun.polarNight };
      }
      const set = firstAfter(sunsets, t);
      return { key: 'sunrise', label: ru.tiles.sunrise, value: clock(t), note: set != null ? ru.sun.sunsetAt(clock(set)) : '' };
    },
    sunset: () => {
      if (f.daily.length === 0) return null;
      const t = firstAfter(sunsets, now);
      if (t == null) {
        return { key: 'sunset', label: ru.tiles.sunset, value: '—', note: f.current.isDay ? ru.sun.polarDay : ru.sun.polarNight };
      }
      const rise = firstAfter(sunrises, t);
      return { key: 'sunset', label: ru.tiles.sunset, value: clock(t), note: rise != null ? ru.sun.sunriseAt(clock(rise)) : '' };
    },
    precipitation: () => ({
      key: 'precipitation',
      label: ru.tiles.precipitation,
      value: formatMm(past3),
      unit: ru.units.mm,
      note: next12 >= 0.1 ? ru.precip.withNext(formatMm(next12)) : ru.precip.none,
    }),
  };

  const rainy = sky === 'rain' || sky === 'storm' || past3 >= 0.1;
  const order = rainy ? ORDER_RAIN : f.current.isDay ? ORDER_DAY : ORDER_NIGHT;
  const candidates = [...order, ...FALLBACK.filter((k) => !order.includes(k))];

  const tiles: TileVM[] = [];
  for (const key of candidates) {
    if (tiles.length === 4) break;
    const tile = make[key]();
    if (tile) tiles.push(tile);
  }
  return tiles;
}
