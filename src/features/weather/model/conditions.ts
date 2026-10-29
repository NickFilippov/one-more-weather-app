import type { Condition, IconKind } from '../types';

export type PrecipKind = 'rain' | 'snow' | 'storm';

interface Entry {
  label: string;
  sky: Condition;
  day: IconKind;
  night: IconKind;
  precip: PrecipKind | null;
}

const e = (label: string, sky: Condition, day: IconKind, night: IconKind, precip: PrecipKind | null = null): Entry => ({
  label,
  sky,
  day,
  night,
  precip,
});

/** Таблица кодов WMO из документации Open-Meteo. См. docs/tech/03. */
const TABLE: Record<number, Entry> = {
  0: e('Ясно', 'clear', 'sun', 'moon'),
  1: e('Малооблачно', 'clear', 'sun', 'moon'),
  2: e('Переменная облачность', 'partly', 'partly', 'cloud'),
  3: e('Облачно', 'clouds', 'cloud', 'cloud'),
  45: e('Туман', 'clouds', 'cloud', 'cloud'),
  48: e('Туман с изморозью', 'clouds', 'cloud', 'cloud'),
  51: e('Слабая морось', 'rain', 'rain', 'rain', 'rain'),
  53: e('Морось', 'rain', 'rain', 'rain', 'rain'),
  55: e('Сильная морось', 'rain', 'rain', 'rain', 'rain'),
  56: e('Слабая ледяная морось', 'rain', 'rain', 'rain', 'rain'),
  57: e('Ледяная морось', 'rain', 'rain', 'rain', 'rain'),
  61: e('Небольшой дождь', 'rain', 'rain', 'rain', 'rain'),
  63: e('Дождь', 'rain', 'rain', 'rain', 'rain'),
  65: e('Сильный дождь', 'rain', 'rain', 'rain', 'rain'),
  66: e('Небольшой ледяной дождь', 'rain', 'rain', 'rain', 'rain'),
  67: e('Ледяной дождь', 'rain', 'rain', 'rain', 'rain'),
  71: e('Небольшой снег', 'clouds', 'snow', 'snow', 'snow'),
  73: e('Снег', 'clouds', 'snow', 'snow', 'snow'),
  75: e('Сильный снег', 'clouds', 'snow', 'snow', 'snow'),
  77: e('Снежная крупа', 'clouds', 'snow', 'snow', 'snow'),
  80: e('Небольшой ливень', 'rain', 'rain', 'rain', 'rain'),
  81: e('Ливень', 'rain', 'rain', 'rain', 'rain'),
  82: e('Сильный ливень', 'rain', 'rain', 'rain', 'rain'),
  85: e('Небольшой снегопад', 'clouds', 'snow', 'snow', 'snow'),
  86: e('Сильный снегопад', 'clouds', 'snow', 'snow', 'snow'),
  95: e('Гроза', 'storm', 'storm', 'storm', 'storm'),
  96: e('Гроза с градом', 'storm', 'storm', 'storm', 'storm'),
  99: e('Сильная гроза с градом', 'storm', 'storm', 'storm', 'storm'),
};

const UNKNOWN: Entry = e('Нет данных', 'clouds', 'cloud', 'cloud');

const entry = (code: number | null | undefined): Entry =>
  code == null ? UNKNOWN : (TABLE[code] ?? UNKNOWN);

export const labelFor = (code: number | null | undefined): string => entry(code).label;
export const skyFor = (code: number | null | undefined): Condition => entry(code).sky;
export const iconFor = (code: number | null | undefined, isDay: boolean): IconKind =>
  isDay ? entry(code).day : entry(code).night;
export const precipKind = (code: number | null | undefined): PrecipKind | null => entry(code).precip;
export const isPrecipitation = (code: number | null | undefined): boolean => entry(code).precip !== null;
export const knownCodes: number[] = Object.keys(TABLE).map(Number);
