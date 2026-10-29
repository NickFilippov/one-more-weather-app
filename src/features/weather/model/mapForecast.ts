import type { RawForecast } from '../schema';
import type { DayPoint, Forecast, HourPoint } from '../types';

const at = <T>(arr: (T | null)[], i: number): T | null => arr[i] ?? null;

export function mapForecast(raw: RawForecast, fetchedAt: number): Forecast {
  const c = raw.current;
  const h = raw.hourly;
  const d = raw.daily;

  // Разные длины параллельных массивов не роняют приложение: берём минимальную.
  const hn = Math.min(
    h.time.length,
    h.temperature_2m.length,
    h.precipitation_probability.length,
    h.precipitation.length,
    h.weather_code.length,
    h.is_day.length,
    h.dew_point_2m.length,
  );
  const hourly: HourPoint[] = [];
  for (let i = 0; i < hn; i++) {
    hourly.push({
      time: h.time[i],
      temp: at(h.temperature_2m, i),
      pop: at(h.precipitation_probability, i),
      precipitation: at(h.precipitation, i),
      code: at(h.weather_code, i),
      isDay: h.is_day[i] === 1,
      dewPoint: at(h.dew_point_2m, i),
    });
  }

  const dn = Math.min(
    d.time.length,
    d.weather_code.length,
    d.temperature_2m_max.length,
    d.temperature_2m_min.length,
    d.precipitation_probability_max.length,
    d.precipitation_sum.length,
    d.sunrise.length,
    d.sunset.length,
  );
  const daily: DayPoint[] = [];
  for (let i = 0; i < dn; i++) {
    daily.push({
      date: d.time[i],
      code: at(d.weather_code, i),
      max: at(d.temperature_2m_max, i),
      min: at(d.temperature_2m_min, i),
      pop: at(d.precipitation_probability_max, i),
      precipitationSum: at(d.precipitation_sum, i),
      sunrise: at(d.sunrise, i),
      sunset: at(d.sunset, i),
    });
  }

  return {
    fetchedAt,
    utcOffsetSeconds: raw.utc_offset_seconds,
    timezone: raw.timezone,
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      isDay: c.is_day === 1,
      precipitation: c.precipitation,
      code: c.weather_code,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      windGusts: c.wind_gusts_10m,
    },
    hourly,
    daily,
    alerts: [],
  };
}
