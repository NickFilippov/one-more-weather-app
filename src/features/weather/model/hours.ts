import type { Forecast, HourPoint } from '../types';

/** Последний час, начавшийся не позже current.time. Если такого нет, 0. */
export function currentHourIndex(f: Forecast): number {
  let idx = -1;
  for (let i = 0; i < f.hourly.length; i++) {
    if (f.hourly[i].time <= f.current.time) idx = i;
    else break;
  }
  return Math.max(idx, 0);
}

/** Часы начиная с текущего: до 25 точек, текущий час первым. */
export function upcomingHours(f: Forecast): HourPoint[] {
  const i0 = currentHourIndex(f);
  return f.hourly.slice(i0, i0 + 25);
}
