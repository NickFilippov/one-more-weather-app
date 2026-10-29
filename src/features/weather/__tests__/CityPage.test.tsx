import { configure, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { City } from '@/features/cities/types';
import { rawOf } from '../__fixtures__/helpers';
import { CityPage } from '../CityPage';
import { mapForecast } from '../model/mapForecast';
import { useWeatherStore } from '../weatherStore';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));
// Skia и размытие — нативные: в Jest их заменяют пустышки
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

configure({ defaultIncludeHiddenElements: true });

const sochi: City = {
  id: 'geo:491422',
  name: 'Сочи',
  latitude: 43.6,
  longitude: 39.72,
  isCurrentLocation: false,
};

const metrics = { frame: { x: 0, y: 0, width: 402, height: 874 }, insets: { top: 62, left: 0, right: 0, bottom: 34 } };

const renderPage = (active = true) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <CityPage city={sochi} active={active} />
    </SafeAreaProvider>,
  );

describe('CityPage', () => {
  beforeEach(() => {
    useWeatherStore.setState({ entries: {}, status: {}, error: {} });
  });

  it('с прогнозом показывает шапку, сводку, дни, плитки и подпись источника', async () => {
    const raw = rawOf('sochi');
    useWeatherStore.setState({ entries: { [sochi.id]: mapForecast(raw, raw.current.time * 1000) } });
    await renderPage(false);
    expect(screen.getByText('Сочи')).toBeTruthy();
    expect(screen.getByText('Прогноз на 10 дней')).toBeTruthy();
    expect(screen.getByText('Данные: Open-Meteo.com')).toBeTruthy();
    expect(screen.getByText('Сегодня')).toBeTruthy();
    expect(screen.getByText('Ощущается как')).toBeTruthy(); // дневной набор плиток
  });

  it('без данных: загрузка', async () => {
    await renderPage();
    expect(screen.getByText('Загрузка…')).toBeTruthy();
  });

  it('без данных и с ошибкой сети: сообщение и «Повторить»', async () => {
    useWeatherStore.setState({ status: { [sochi.id]: 'error' }, error: { [sochi.id]: { kind: 'offline' } } });
    await renderPage();
    expect(screen.getByText('Не удалось загрузить погоду')).toBeTruthy();
    expect(screen.getByText('Нет подключения к интернету.')).toBeTruthy();
    expect(screen.getByLabelText('Повторить')).toBeTruthy();
  });

  it('есть данные, но обновление не удалось: пометка времени, содержимое остаётся', async () => {
    const raw = rawOf('sochi');
    useWeatherStore.setState({
      entries: { [sochi.id]: mapForecast(raw, raw.current.time * 1000) },
      status: { [sochi.id]: 'error' },
      error: { [sochi.id]: { kind: 'offline' } },
    });
    await renderPage(false);
    expect(screen.getByText(/^Нет связи\. Данные на \d{1,2}:\d{2}$/)).toBeTruthy();
    expect(screen.getByText('Прогноз на 10 дней')).toBeTruthy();
  });
});
