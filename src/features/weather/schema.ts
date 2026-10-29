import { z } from 'zod';

const num = z.number();
const numOrNull = z.number().nullable();
const series = z.array(numOrNull);

export const forecastSchema = z.object({
  utc_offset_seconds: num,
  timezone: z.string(),
  current: z.object({
    time: num,
    temperature_2m: num,
    apparent_temperature: numOrNull,
    relative_humidity_2m: numOrNull,
    is_day: num,
    precipitation: numOrNull,
    weather_code: num,
    wind_speed_10m: numOrNull,
    wind_direction_10m: numOrNull,
    wind_gusts_10m: numOrNull,
  }),
  hourly: z.object({
    time: z.array(num),
    temperature_2m: series,
    precipitation_probability: series,
    precipitation: series,
    weather_code: series,
    is_day: series,
    dew_point_2m: series,
  }),
  daily: z.object({
    time: z.array(num),
    weather_code: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
    precipitation_probability_max: series,
    precipitation_sum: series,
    sunrise: series,
    sunset: series,
  }),
});

export type RawForecast = z.infer<typeof forecastSchema>;
