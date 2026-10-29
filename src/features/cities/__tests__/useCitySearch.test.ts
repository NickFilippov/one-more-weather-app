import { act, renderHook } from '@testing-library/react-native';
import { searchCities, type SearchCitiesResult } from '../geocodingApi';
import { DEBOUNCE_MS, useCitySearch } from '../useCitySearch';

jest.mock('../geocodingApi');
const mockSearch = searchCities as jest.MockedFunction<typeof searchCities>;

const found = (name: string): SearchCitiesResult => ({
  ok: true,
  data: [{ city: { id: `geo:${name}`, name, latitude: 0, longitude: 0, isCurrentLocation: false }, sub: '' }],
});

describe('useCitySearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearch.mockReset();
    mockSearch.mockImplementation(async (q) => found(q));
  });
  afterEach(() => jest.useRealTimers());

  const setup = () => renderHook((text: string) => useCitySearch(text), { initialProps: '' });
  const wait = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

  it('меньше двух символов после trim: idle и без запроса', async () => {
    const { result, rerender } = await setup();
    await rerender(' С ');
    await wait(DEBOUNCE_MS * 2);
    expect(result.current).toEqual({ status: 'idle', results: [] });
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('быстрый ввод «Со» → «Соч»: один запрос с последним текстом', async () => {
    const { result, rerender } = await setup();
    await rerender('Со');
    await wait(100);
    await rerender('Соч');
    expect(result.current.status).toBe('loading');
    await wait(DEBOUNCE_MS);
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith('Соч');
    expect(result.current.status).toBe('done');
    expect(result.current.results.map((r) => r.city.name)).toEqual(['Соч']);
  });

  it('ответ на устаревший запрос не показывается', async () => {
    let resolveOld: (r: SearchCitiesResult) => void = () => {};
    mockSearch.mockImplementationOnce(() => new Promise((r) => (resolveOld = r)));
    const { result, rerender } = await setup();
    await rerender('Каз');
    await wait(DEBOUNCE_MS);
    await rerender('Казань');
    await wait(DEBOUNCE_MS);
    expect(result.current.results[0].city.name).toBe('Казань');
    await act(async () => resolveOld(found('Каз')));
    expect(result.current.status).toBe('done');
    expect(result.current.results[0].city.name).toBe('Казань');
  });

  it('ошибка поиска: error', async () => {
    mockSearch.mockResolvedValue({ ok: false, error: { kind: 'offline' } });
    const { result, rerender } = await setup();
    await rerender('Казань');
    await wait(DEBOUNCE_MS);
    expect(result.current).toEqual({ status: 'error', results: [] });
  });
});
