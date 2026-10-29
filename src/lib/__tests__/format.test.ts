import { cityClock } from '../time';
import {
  formatClock,
  formatHour,
  formatMm,
  formatPercent,
  formatRangeCard,
  formatRangeHero,
  formatTemp,
  formatTempNumber,
  formatWeekday,
  formatWind,
  plural,
  roundTemp,
} from '../format';

describe('температура', () => {
  it('округляет математически и убирает -0', () => {
    expect(roundTemp(7.5)).toBe(8);
    expect(roundTemp(-0.4)).toBe(0);
    expect(Object.is(roundTemp(-0.4), -0)).toBe(false);
    expect(roundTemp(-2.5)).toBe(-2);
  });
  it('пишет типографский минус и градус без пробела', () => {
    expect(formatTemp(8)).toBe('8°');
    expect(formatTemp(-3)).toBe('−3°');
    expect(formatTemp(-3).charCodeAt(0)).toBe(0x2212);
    expect(formatTemp(0)).toBe('0°');
    expect(formatTemp(-0.2)).toBe('0°');
    expect(formatTempNumber(-3)).toBe('−3');
  });
  it('формирует диапазоны как в макетах', () => {
    expect(formatRangeHero(9, 4)).toBe('Макс.: 9°, мин.: 4°');
    expect(formatRangeCard(9, -1)).toBe('Макс. 9° · мин. −1°');
  });
});

describe('время', () => {
  const d = (h: number, m: number) => new Date(Date.UTC(2026, 9, 27, h, m));
  it('формат ч:мм без ведущего нуля у часов', () => {
    expect(formatClock(d(8, 52))).toBe('8:52');
    expect(formatClock(d(14, 5))).toBe('14:05');
    expect(formatClock(d(0, 30))).toBe('0:30');
  });
  it('час в ленте двузначный', () => {
    expect(formatHour(d(0, 0))).toBe('00');
    expect(formatHour(d(7, 0))).toBe('07');
    expect(formatHour(d(15, 0))).toBe('15');
  });
  it('день недели: первый — Сегодня', () => {
    const tue = new Date(Date.UTC(2026, 9, 27)); // вторник
    expect(formatWeekday(tue, 0)).toBe('Сегодня');
    expect(formatWeekday(tue, 1)).toBe('Вт');
  });
  it('cityClock сдвигает на пояс города и не съезжает через полночь', () => {
    const utc = Date.UTC(2026, 9, 26, 22, 30) / 1000;
    const moscow = cityClock(utc, 3 * 3600);
    expect(moscow.getUTCHours()).toBe(1);
    expect(moscow.getUTCDate()).toBe(27);
    const oslo = cityClock(utc, 1 * 3600);
    expect(oslo.getUTCHours()).toBe(23);
    expect(oslo.getUTCDate()).toBe(26);
  });
});

describe('числа', () => {
  it('осадки: до 10 мм один знак с запятой', () => {
    expect(formatMm(0.4)).toBe('0,4');
    expect(formatMm(2.6)).toBe('2,6');
    expect(formatMm(0)).toBe('0');
    expect(formatMm(9)).toBe('9');
    expect(formatMm(9.96)).toBe('10');
    expect(formatMm(18.3)).toBe('18');
  });
  it('ветер, проценты', () => {
    expect(formatWind(6.4)).toBe('6');
    expect(formatPercent(60)).toBe('60%');
  });
  it('склонение', () => {
    expect(plural(1, 'час', 'часа', 'часов')).toBe('час');
    expect(plural(2, 'час', 'часа', 'часов')).toBe('часа');
    expect(plural(5, 'час', 'часа', 'часов')).toBe('часов');
    expect(plural(11, 'час', 'часа', 'часов')).toBe('часов');
    expect(plural(21, 'час', 'часа', 'часов')).toBe('час');
    expect(plural(0, 'час', 'часа', 'часов')).toBe('часов');
  });
});
