import { fetchForecast, forecastUrl } from '../api';
import { fixtures } from '../__fixtures__/helpers';

describe('forecastUrl', () => {
  it('содержит все параметры и округляет координаты до 0.01', () => {
    const url = new URL(forecastUrl(55.7558, 37.6173));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('55.76');
    expect(url.searchParams.get('longitude')).toBe('37.62');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('10');
    expect(url.searchParams.get('past_hours')).toBe('3');
    expect(url.searchParams.get('forecast_hours')).toBe('25');
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('current')).toContain('weather_code');
    expect(url.searchParams.get('hourly')).toContain('dew_point_2m');
    expect(url.searchParams.get('daily')).toContain('sunrise');
  });
});

describe('fetchForecast', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('разбирает ответ', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => fixtures.sochi });
    const res = await fetchForecast(43.6, 39.72);
    expect(res.ok).toBe(true);
  });

  it('ответ без обязательного поля — invalid', async () => {
    const bad = structuredClone(fixtures.sochi) as unknown as { current: Record<string, unknown> };
    delete bad.current.weather_code;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => bad });
    const res = await fetchForecast(43.6, 39.72);
    expect(res).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });
});
