import type { City } from '@/features/cities/types';
import { rawOf } from '../__fixtures__/helpers';
import { fetchForecast } from '../api';
import { FRESH_MS, useWeatherStore } from '../weatherStore';

jest.mock('expo-sqlite/kv-store', () => {
  const mem = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => mem.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: async (k: string) => {
        mem.delete(k);
      },
    },
  };
});
jest.mock('../api');

const mockFetch = fetchForecast as jest.MockedFunction<typeof fetchForecast>;
const city = (id: string): City => ({ id, name: id, latitude: 1, longitude: 2, isCurrentLocation: false });

describe('weatherStore', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] }).setSystemTime(new Date('2026-10-27T12:00:00Z'));
    mockFetch.mockReset();
    mockFetch.mockImplementation(async () => ({ ok: true, data: rawOf('sochi') }));
    useWeatherStore.setState({ entries: {}, status: {}, error: {} });
  });
  afterEach(() => jest.useRealTimers());

  it('сохраняет прогноз и время получения', async () => {
    await useWeatherStore.getState().refresh(city('a'));
    const s = useWeatherStore.getState();
    expect(s.entries.a.fetchedAt).toBe(Date.now());
    expect(s.status.a).toBe('idle');
    expect(mockFetch).toHaveBeenCalledWith(1, 2);
  });

  it('свежие данные не запрашивает, force запрашивает', async () => {
    await useWeatherStore.getState().refresh(city('a'));
    jest.setSystemTime(Date.now() + FRESH_MS - 1000);
    await useWeatherStore.getState().refresh(city('a'));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await useWeatherStore.getState().refresh(city('a'), { force: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('данные старше 30 минут запрашивает снова', async () => {
    await useWeatherStore.getState().refresh(city('a'));
    jest.setSystemTime(Date.now() + FRESH_MS + 1000);
    await useWeatherStore.getState().refresh(city('a'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('два параллельных refresh — один запрос', async () => {
    const [p1, p2] = [useWeatherStore.getState().refresh(city('a')), useWeatherStore.getState().refresh(city('a'))];
    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('ошибка не стирает старые данные', async () => {
    await useWeatherStore.getState().refresh(city('a'));
    const before = useWeatherStore.getState().entries.a;
    mockFetch.mockResolvedValue({ ok: false, error: { kind: 'offline' } });
    await useWeatherStore.getState().refresh(city('a'), { force: true });
    const s = useWeatherStore.getState();
    expect(s.entries.a).toBe(before);
    expect(s.status.a).toBe('error');
    expect(s.error.a).toEqual({ kind: 'offline' });
  });

  it('refreshAll: не больше 4 запросов одновременно, все города обработаны', async () => {
    let running = 0;
    let peak = 0;
    mockFetch.mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await Promise.resolve();
      await Promise.resolve();
      running--;
      return { ok: true, data: rawOf('sochi') };
    });
    const cities = Array.from({ length: 10 }, (_, i) => city(`c${i}`));
    await useWeatherStore.getState().refreshAll(cities);
    expect(Object.keys(useWeatherStore.getState().entries)).toHaveLength(10);
    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1);
  });
});
