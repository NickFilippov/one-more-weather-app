import { buildSummary } from '../model/summary';
import { forecastOf } from '../__fixtures__/helpers';
import { cityClock } from '@/lib/time';
import type { RawForecast } from '../schema';

/** Выставляет код и осадки по часам ленты: hourly[3] — текущий час. */
function withPlan(plan: Record<number, number>, nowCode: number, opts: { isDay?: boolean; temps?: Record<number, number> } = {}) {
  return forecastOf('sochi', (r: RawForecast) => {
    r.current.weather_code = nowCode;
    r.current.is_day = opts.isDay === false ? 0 : 1;
    r.hourly.weather_code = r.hourly.weather_code.map(() => 3);
    r.hourly.precipitation = r.hourly.precipitation.map(() => 0);
    for (const [i, code] of Object.entries(plan)) r.hourly.weather_code[Number(i)] = code;
    for (const [i, t] of Object.entries(opts.temps ?? {})) r.hourly.temperature_2m[Number(i)] = t;
  });
}

const hh = (f: { utcOffsetSeconds: number; hourly: { time: number }[] }, i: number) =>
  String(cityClock(f.hourly[i].time, f.utcOffsetSeconds).getUTCHours()).padStart(2, '0');

describe('первая фраза', () => {
  it('дождь закончится в час k', () => {
    const { f } = withPlan({ 4: 61, 5: 61 }, 61);
    expect(buildSummary(f)).toContain(`Дождь закончится около ${hh(f, 6)}:00.`);
  });
  it('дождь не прекратится', () => {
    const plan: Record<number, number> = {};
    for (let i = 4; i < 28; i++) plan[i] = 63;
    const { f } = withPlan(plan, 63);
    expect(buildSummary(f)).toContain('Дождь в ближайшие сутки не прекратится.');
  });
  it('около k начнётся дождь, снег, гроза', () => {
    const rain = withPlan({ 6: 61 }, 3);
    expect(buildSummary(rain.f)).toContain(`Около ${hh(rain.f, 6)}:00 начнётся дождь.`);
    const snow = withPlan({ 6: 73 }, 3);
    expect(buildSummary(snow.f)).toContain('начнётся снег.');
    const storm = withPlan({ 6: 95 }, 3);
    expect(buildSummary(storm.f)).toContain('начнётся гроза.');
  });
  it('без осадков', () => {
    const { f } = withPlan({}, 3);
    expect(buildSummary(f)).toMatch(/^Без осадков в ближайшие сутки\./);
  });
  it('гроза сейчас: «Гроза закончится»', () => {
    const { f } = withPlan({ 4: 95 }, 95);
    expect(buildSummary(f)).toContain('Гроза закончится');
  });
});

describe('вторая фраза', () => {
  /** Сдвигает ряды так, чтобы текущий час (hourly[3]) приходился на местный час `hour`. */
  function atLocalHour(hour: number, isDay: boolean, temps: (i: number, localHour: number) => number) {
    const { f } = withPlan({}, isDay ? 3 : 0, { isDay });
    const start = Math.floor(f.hourly[3].time / 86400) * 86400 + hour * 3600 - f.utcOffsetSeconds;
    const hourly = f.hourly.map((h, i) => {
      const t = start + (i - 3) * 3600;
      const lh = cityClock(t, f.utcOffsetSeconds).getUTCHours();
      return { ...h, time: t, isDay: lh >= 8 && lh < 20, temp: temps(i, lh) };
    });
    return { ...f, current: { ...f.current, time: start + 600, isDay, temp: 10 }, hourly };
  }

  it('днём: «Ночью до N°» — минимум по часам 0–6', () => {
    const f = atLocalHour(10, true, (_, lh) => (lh <= 6 ? 3 - lh / 10 : 12));
    expect(buildSummary(f)).toBe('Без осадков в ближайшие сутки. Ночью до 2°.');
    const cold = atLocalHour(10, true, (_, lh) => (lh === 5 ? -1.4 : 8));
    expect(buildSummary(cold)).toBe('Без осадков в ближайшие сутки. Ночью до −1°.');
  });

  it('ночью: «К утру до N°» — от текущего часа до 7:00', () => {
    const f = atLocalHour(22, false, (_, lh) => (lh === 5 ? -1 : lh === 12 ? -30 : 4));
    expect(buildSummary(f)).toBe('Без осадков в ближайшие сутки. К утру до −1°.');
  });

  it('нет ночных часов в ленте — второй фразы нет', () => {
    const f = atLocalHour(10, true, () => 12);
    const short = { ...f, hourly: f.hourly.slice(0, 8) }; // часы 10–14
    expect(buildSummary(short)).toBe('Без осадков в ближайшие сутки.');
  });
});
