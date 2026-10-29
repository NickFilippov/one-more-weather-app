import { configure, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CitiesScreen from '@/app/cities';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { GlassModeProvider } from '@/theme/ThemeProvider';
import { useCitiesStore } from '../citiesStore';
import { searchCities } from '../geocodingApi';
import { useUiStore } from '../uiStore';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('../geocodingApi');
// Задержку ввода проверяет тест useCitySearch; здесь она мешает: фейковые таймеры ломают анимации
jest.mock('@/lib/useDebouncedValue', () => ({ useDebouncedValue: <T,>(v: T) => v }));
jest.mock('@shopify/react-native-skia', () => {
  const Noop = () => null;
  return {
    Canvas: Noop,
    Group: Noop,
    Circle: Noop,
    RadialGradient: Noop,
    Blur: Noop,
    Path: Noop,
    vec: (x: number, y: number) => ({ x, y }),
    Skia: { PathBuilder: { Make: () => ({ moveTo() {}, lineTo() {}, build: () => ({}) }) } },
  };
});
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native');
  return { BlurView: View, BlurTargetView: View };
});

configure({ defaultIncludeHiddenElements: true });

const mockSearch = searchCities as jest.MockedFunction<typeof searchCities>;
const kazan = { id: 'geo:551487', name: 'Казань', region: 'Татарстан', country: 'Россия', latitude: 55.79, longitude: 49.12, isCurrentLocation: false };
const metrics = { frame: { x: 0, y: 0, width: 402, height: 874 }, insets: { top: 62, left: 0, right: 0, bottom: 34 } };

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <GlassModeProvider>
        <CitiesScreen />
      </GlassModeProvider>
    </SafeAreaProvider>,
  );

const type = async (text: string) => {
  await fireEvent.changeText(screen.getByLabelText('Поиск города'), text);
};

describe('экран городов', () => {
  const refresh = jest.fn(async () => {});

  beforeEach(() => {
    jest.mocked(router.back).mockReset();
    mockSearch.mockReset();
    mockSearch.mockResolvedValue({ ok: true, data: [{ city: kazan, sub: 'Татарстан, Россия' }] });
    refresh.mockClear();
    useCitiesStore.setState({ currentLocation: null, saved: [] });
    useWeatherStore.setState({ entries: {}, status: {}, error: {}, refresh });
    useUiStore.setState({ activeCityId: null });
  });

  it('найденный город добавляется, грузит погоду, поле очищается, появляется карточка', async () => {
    await renderScreen();
    await type('Каз');
    expect(mockSearch).toHaveBeenCalledWith('Каз');
    await fireEvent.press(screen.getByLabelText('Казань, Татарстан, Россия'));
    expect(useCitiesStore.getState().saved).toEqual([kazan]);
    expect(refresh).toHaveBeenCalledWith(kazan, { force: true });
    expect(screen.getByLabelText('Поиск города').props.value).toBe('');
    expect(screen.getByLabelText('Казань, загрузка…')).toBeTruthy();
  });

  it('город из списка: «Уже в списке», нажатие открывает его и не создаёт дубль', async () => {
    useCitiesStore.setState({ saved: [kazan] });
    await renderScreen();
    await type('Казань');
    expect(screen.getByText('Уже в списке')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Казань, Татарстан, Россия, Уже в списке'));
    expect(useCitiesStore.getState().saved).toHaveLength(1);
    expect(useUiStore.getState().activeCityId).toBe(kazan.id);
    expect(router.back).toHaveBeenCalled();
  });

  it('нажатие на карточку делает город активным и возвращает на главный', async () => {
    useCitiesStore.setState({ saved: [kazan] });
    useWeatherStore.setState({ status: { [kazan.id]: 'error' } });
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Казань, нет данных'));
    expect(useUiStore.getState().activeCityId).toBe(kazan.id);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('ничего не найдено', async () => {
    mockSearch.mockResolvedValue({ ok: true, data: [] });
    await renderScreen();
    await type('ывап');
    expect(screen.getByText('Ничего не нашлось. Попробуйте другое название или код аэропорта.')).toBeTruthy();
  });
});
