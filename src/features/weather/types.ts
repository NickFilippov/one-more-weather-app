export type Condition = 'clear' | 'partly' | 'clouds' | 'rain' | 'storm';
export type IconKind = 'sun' | 'moon' | 'partly' | 'cloud' | 'rain' | 'storm' | 'snow';
export type ThemeName = 'day' | 'night';

export type WeatherError =
  | { kind: 'offline' }
  | { kind: 'rate-limit' }
  | { kind: 'server'; status: number; reason?: string }
  | { kind: 'invalid'; issues: string };

export interface CurrentWeather {
  time: number; // Unix-секунды
  temp: number; // °C, не округлено
  feelsLike: number | null;
  humidity: number | null; // %
  isDay: boolean;
  precipitation: number | null; // мм
  code: number; // WMO
  windSpeed: number | null; // м/с
  windDirection: number | null; // градусы, откуда дует
  windGusts: number | null; // м/с
}

export interface HourPoint {
  time: number; // начало часа, Unix-секунды
  temp: number | null;
  pop: number | null; // вероятность осадков, %
  precipitation: number | null; // мм за час
  code: number | null;
  isDay: boolean;
  dewPoint: number | null;
}

export interface DayPoint {
  date: number; // местная полночь, Unix-секунды
  code: number | null;
  max: number | null;
  min: number | null;
  pop: number | null;
  precipitationSum: number | null;
  sunrise: number | null;
  sunset: number | null;
}

/** Задел: в первой версии не заполняется (решение владельца). */
export interface WeatherAlert {
  title: string;
  summary: string;
  details?: string;
  endsAt?: number;
}

export interface Forecast {
  fetchedAt: number; // мс, Date.now()
  utcOffsetSeconds: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourPoint[];
  daily: DayPoint[];
  alerts: WeatherAlert[];
}

export interface HeroVM {
  place: string;
  temp: number;
  condition: string;
  high: number;
  low: number;
}
export interface HourVM {
  time?: string;
  icon: IconKind;
  temp: number;
  pop?: number;
  now?: boolean;
  a11y: string;
}
export interface DayVM {
  day: string;
  icon: IconKind;
  low: number;
  high: number;
  pop?: number;
  now?: number;
  a11y: string;
}
export type TileKey = 'feelsLike' | 'wind' | 'humidity' | 'sunrise' | 'sunset' | 'precipitation';
export interface TileVM {
  key: TileKey;
  label: string;
  value: string;
  unit?: string;
  note: string;
}
export interface MainVM {
  theme: ThemeName;
  sky: Condition;
  hero: HeroVM;
  summary: string;
  hours: HourVM[];
  days: DayVM[];
  dayMin: number;
  dayMax: number;
  tiles: TileVM[];
  updatedAt: string;
}
export interface CityCardVM {
  id: string;
  theme: ThemeName;
  sky: Condition;
  name: string;
  sub: string;
  temp: string;
  label: string;
  range: string;
  a11y: string;
}
