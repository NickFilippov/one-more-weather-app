import type { City } from '../types';
import { selectPages, useCitiesStore } from '../citiesStore';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));

const city = (id: string, isCurrentLocation = false): City => ({ id, name: id, latitude: 0, longitude: 0, isCurrentLocation });

describe('citiesStore', () => {
  beforeEach(() => useCitiesStore.setState({ currentLocation: null, saved: [], locationPermission: 'unknown' }));

  it('список начинается пустым', () => {
    expect(useCitiesStore.getInitialState().saved).toEqual([]);
  });

  it('добавляет в конец в порядке добавления', () => {
    const { addCity } = useCitiesStore.getState();
    expect(addCity(city('geo:1'))).toBe('added');
    expect(addCity(city('geo:2'))).toBe('added');
    expect(useCitiesStore.getState().saved.map((c) => c.id)).toEqual(['geo:1', 'geo:2']);
  });

  it('дубль по id не добавляется', () => {
    const { addCity } = useCitiesStore.getState();
    addCity(city('geo:1'));
    expect(addCity({ ...city('geo:1'), name: 'другое имя' })).toBe('duplicate');
    expect(useCitiesStore.getState().saved).toHaveLength(1);
  });

  it('дубль с местоположением не добавляется', () => {
    useCitiesStore.getState().setCurrentLocation(city('current-location', true));
    expect(useCitiesStore.getState().addCity(city('current-location'))).toBe('duplicate');
    expect(useCitiesStore.getState().saved).toEqual([]);
  });

  it('selectPages: местоположение первым', () => {
    const here = city('current-location', true);
    expect(selectPages({ currentLocation: null, saved: [city('a')] }).map((c) => c.id)).toEqual(['a']);
    expect(selectPages({ currentLocation: here, saved: [city('a')] }).map((c) => c.id)).toEqual(['current-location', 'a']);
  });
});
