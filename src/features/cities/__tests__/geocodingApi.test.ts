import { getJson } from '@/lib/http';
import soch from '../__fixtures__/geocoding-soch.json';
import { geocodingUrl, searchCities } from '../geocodingApi';

jest.mock('@/lib/http');
const mockGet = getJson as jest.MockedFunction<typeof getJson>;

describe('searchCities', () => {
  beforeEach(() => mockGet.mockReset());

  it('URL: имя закодировано, 10 результатов, русский язык', () => {
    expect(geocodingUrl('Сочи')).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=%D0%A1%D0%BE%D1%87%D0%B8&count=10&language=ru&format=json',
    );
  });

  it('ответ «Соч»: id GeoNames, регион и подпись «регион, страна»', async () => {
    mockGet.mockResolvedValue({ ok: true, data: soch });
    const res = await searchCities('Соч');
    if (!res.ok) throw new Error('ожидался успех');
    expect(res.data).toHaveLength(5);
    expect(res.data[0]).toEqual({
      city: {
        id: 'geo:491422',
        name: 'Сочи',
        region: 'Краснодарский край',
        country: 'Россия',
        latitude: 43.59699,
        longitude: 39.72477,
        isCurrentLocation: false,
      },
      sub: 'Краснодарский край, Россия',
    });
    expect(res.data[1].sub).toBe('Мехико, Мексика');
  });

  it('ответ без results: пустой список', async () => {
    mockGet.mockResolvedValue({ ok: true, data: { generationtime_ms: 0.07 } });
    await expect(searchCities('ывап')).resolves.toEqual({ ok: true, data: [] });
  });

  it('аэропорт: подпись с «Аэропорт · »', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      data: {
        results: [
          { id: 6301485, name: 'Шереметьево', latitude: 55.97, longitude: 37.41, feature_code: 'AIRP', country: 'Россия', admin1: 'Московская область' },
          { id: 1, name: 'Без региона', latitude: 0, longitude: 0, feature_code: 'AIRP' },
        ],
      },
    });
    const res = await searchCities('SVO');
    if (!res.ok) throw new Error('ожидался успех');
    expect(res.data.map((r) => r.sub)).toEqual(['Аэропорт · Московская область, Россия', 'Аэропорт']);
  });

  it('ошибка сети передаётся как есть', async () => {
    mockGet.mockResolvedValue({ ok: false, error: { kind: 'offline' } });
    await expect(searchCities('Казань')).resolves.toEqual({ ok: false, error: { kind: 'offline' } });
  });

  it('неверный ответ: invalid', async () => {
    mockGet.mockResolvedValue({ ok: true, data: { results: [{ id: 'x' }] } });
    const res = await searchCities('Казань');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.kind).toBe('invalid');
  });
});
