import { ru } from '@/i18n/ru';

const MINUS = '−';

/** Математическое округление; -0 превращается в 0 (BR-03). */
export function roundTemp(x: number): number {
  const r = Math.round(x);
  return r === 0 ? 0 : r;
}

export function formatTempNumber(n: number): string {
  const r = roundTemp(n);
  return r < 0 ? `${MINUS}${Math.abs(r)}` : String(r);
}

export function formatTemp(n: number): string {
  return `${formatTempNumber(n)}°`;
}

export function formatClock(d: Date): string {
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCHours()}:${mm}`;
}

export function formatHour(d: Date): string {
  return String(d.getUTCHours()).padStart(2, '0');
}

export function formatWeekday(d: Date, index: number): string {
  return index === 0 ? ru.today : ru.weekdays[d.getUTCDay()];
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

/** Меньше 10 мм: один знак с запятой, если число не целое; иначе целое. */
export function formatMm(x: number): string {
  if (x >= 10) return String(Math.round(x));
  const r = Math.round(x * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
}

export function formatWind(x: number): string {
  return String(Math.round(x));
}

export function formatRangeHero(hi: number, lo: number): string {
  return `Макс.: ${formatTemp(hi)}, мин.: ${formatTemp(lo)}`;
}

export function formatRangeCard(hi: number, lo: number): string {
  return `Макс. ${formatTemp(hi)} · мин. ${formatTemp(lo)}`;
}

/** Русское склонение: plural(1, "час", "часа", "часов") → "час". */
export function plural(n: number, one: string, few: string, many: string): string {
  const m100 = Math.abs(n) % 100;
  const m10 = m100 % 10;
  if (m100 > 10 && m100 < 20) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}
