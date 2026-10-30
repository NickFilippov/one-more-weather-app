import * as Location from 'expo-location';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { useCitiesStore } from '../citiesStore';
import type { City } from '../types';
import { searchCities } from '../geocodingApi';
import { refreshLocation, requestAndLocate, useLocateStatus } from '../useCurrentLocation';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));
jest.mock('../geocodingApi');
jest.mock('expo-location', () => ({
  Accuracy: { Low: 2, High: 5 },
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

const loc = jest.mocked(Location);
const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude }, timestamp: 0 }) as Location.LocationObject;
const permission = (status: string) => ({ status }) as Location.LocationPermissionResponse;
const here = (patch: Partial<City> = {}): City => ({
  id: 'current-location',
  name: 'Москва',
  latitude: 55.76,
  longitude: 37.62,
  isCurrentLocation: true,
  ...patch,
});

describe('текущее местоположение', () => {
  const refresh = jest.fn(async () => {});

  beforeEach(() => {
    jest.resetAllMocks();
    refresh.mockClear();
    loc.requestForegroundPermissionsAsync.mockResolvedValue(permission('granted'));
    loc.getForegroundPermissionsAsync.mockResolvedValue(permission('granted'));
    loc.getLastKnownPositionAsync.mockResolvedValue(null);
    loc.getCurrentPositionAsync.mockResolvedValue(position(55.75583, 37.6173));
    loc.reverseGeocodeAsync.mockResolvedValue([{ city: 'Москва', subregion: null, region: 'Москва' } as Location.LocationGeocodedAddress]);
    useCitiesStore.setState({ currentLocation: null, saved: [], locationPermission: 'unknown' });
    useWeatherStore.setState({ entries: {}, status: {}, error: {}, refresh });
    useLocateStatus.setState({ status: 'idle' });
  });

  it('по нажатию: доступ, координаты до 0.01, название от ОС, погода с force', async () => {
    await requestAndLocate();
    const s = useCitiesStore.getState();
    expect(s.locationPermission).toBe('granted');
    expect(s.currentLocation).toEqual(here());
    expect(loc.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Low });
    expect(refresh).toHaveBeenCalledWith(here(), { force: true });
    expect(useLocateStatus.getState().status).toBe('idle');
  });

  it('недавняя позиция берётся без нового определения', async () => {
    loc.getLastKnownPositionAsync.mockResolvedValue(position(59.9386, 30.3141));
    await requestAndLocate();
    expect(loc.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(useCitiesStore.getState().currentLocation).toMatchObject({ latitude: 59.94, longitude: 30.31 });
  });

  it('отказ: denied, местоположения нет, кнопка уходит', async () => {
    loc.requestForegroundPermissionsAsync.mockResolvedValue(permission('denied'));
    await requestAndLocate();
    expect(useCitiesStore.getState()).toMatchObject({ locationPermission: 'denied', currentLocation: null });
    expect(loc.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(useLocateStatus.getState().status).toBe('idle');
  });

  it('геокодер ОС ответил латиницей: название по-русски из поиска, ближайшее к месту', async () => {
    loc.reverseGeocodeAsync.mockResolvedValue([{ city: 'Moskva' } as Location.LocationGeocodedAddress]);
    const far = { id: 'geo:1', name: 'Москва', latitude: 46, longitude: -117, isCurrentLocation: false };
    const near = { id: 'geo:524901', name: 'Москва', latitude: 55.75222, longitude: 37.61556, isCurrentLocation: false };
    jest.mocked(searchCities).mockResolvedValue({ ok: true, data: [{ city: far, sub: '' }, { city: near, sub: '' }] });
    await requestAndLocate();
    expect(searchCities).toHaveBeenCalledWith('Moskva');
    expect(useCitiesStore.getState().currentLocation?.name).toBe('Москва');
  });

  it('латиница, а поиск не ответил: название ОС как есть', async () => {
    loc.reverseGeocodeAsync.mockResolvedValue([{ city: 'Moskva' } as Location.LocationGeocodedAddress]);
    jest.mocked(searchCities).mockResolvedValue({ ok: false, error: { kind: 'offline' } });
    await requestAndLocate();
    expect(useCitiesStore.getState().currentLocation?.name).toBe('Moskva');
  });

  it('геокодер не ответил: запасное название', async () => {
    loc.reverseGeocodeAsync.mockRejectedValue(new Error('rate limit'));
    await requestAndLocate();
    expect(useCitiesStore.getState().currentLocation?.name).toBe('Моё местоположение');
  });

  it('геолокация выключена: ошибка, список не меняется', async () => {
    loc.getCurrentPositionAsync.mockRejectedValue(new Error('Location services are disabled'));
    await requestAndLocate();
    expect(useLocateStatus.getState().status).toBe('error');
    expect(useCitiesStore.getState().currentLocation).toBeNull();
  });

  it('сеть места не дала за 8 секунд: один раз просит GPS', async () => {
    jest.useFakeTimers();
    loc.getCurrentPositionAsync.mockImplementation((options) =>
      options?.accuracy === Location.Accuracy.Low ? new Promise(() => {}) : Promise.resolve(position(55.75583, 37.6173)),
    );
    const done = requestAndLocate();
    await jest.advanceTimersByTimeAsync(8_000);
    await done;
    expect(loc.getCurrentPositionAsync).toHaveBeenLastCalledWith({ accuracy: Location.Accuracy.High });
    expect(useCitiesStore.getState().currentLocation).toEqual(here());
    jest.useRealTimers();
  });

  it('координат нет и от GPS: ошибка вместо вечного ожидания', async () => {
    jest.useFakeTimers();
    loc.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));
    const done = requestAndLocate();
    await jest.advanceTimersByTimeAsync(8_000 + 20_000);
    await done;
    expect(useLocateStatus.getState().status).toBe('error');
    expect(useCitiesStore.getState().currentLocation).toBeNull();
    jest.useRealTimers();
  });

  it('при запуске без решения о доступе ничего не спрашивает', async () => {
    await refreshLocation();
    expect(loc.getForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(loc.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('при запуске на том же месте: без геокодера и без force', async () => {
    useCitiesStore.setState({ currentLocation: here(), locationPermission: 'granted' });
    await refreshLocation();
    expect(loc.reverseGeocodeAsync).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith(here(), { force: false });
  });

  it('сдвиг меньше 0.05°: название прежнее, погода заново', async () => {
    useCitiesStore.setState({ currentLocation: here({ latitude: 55.74 }), locationPermission: 'granted' });
    await refreshLocation();
    expect(loc.reverseGeocodeAsync).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith(here(), { force: true });
  });

  it('переезд: новое название', async () => {
    useCitiesStore.setState({ currentLocation: here({ name: 'Казань', latitude: 55.79, longitude: 49.12 }), locationPermission: 'granted' });
    await refreshLocation();
    expect(useCitiesStore.getState().currentLocation?.name).toBe('Москва');
  });

  it('доступ забрали в настройках: страница местоположения уходит', async () => {
    useCitiesStore.setState({ currentLocation: here(), locationPermission: 'granted' });
    loc.getForegroundPermissionsAsync.mockResolvedValue(permission('denied'));
    await refreshLocation();
    expect(useCitiesStore.getState()).toMatchObject({ locationPermission: 'denied', currentLocation: null });
  });

  it('доступ дали в настройках после отказа: местоположение появляется', async () => {
    useCitiesStore.setState({ locationPermission: 'denied' });
    await refreshLocation();
    expect(useCitiesStore.getState()).toMatchObject({ locationPermission: 'granted', currentLocation: here() });
    expect(loc.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });
});
