import { configure, fireEvent, render, screen } from '@testing-library/react-native';
import { CityCard } from '../CityCard';
import { SearchField } from '../SearchField';
import { SearchResults } from '@/features/cities/SearchResults';
import { citiesList } from '@/mocks/citiesList';
import { GlassModeProvider, ThemeProvider } from '@/theme/ThemeProvider';

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
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native');
  return { BlurView: View, BlurTargetView: View };
});

configure({ defaultIncludeHiddenElements: true });

const inNight = (node: React.ReactElement) =>
  render(
    <GlassModeProvider>
      <ThemeProvider theme="night">{node}</ThemeProvider>
    </GlassModeProvider>,
  );

const kazan = { id: 'geo:551487', name: 'Казань', latitude: 55.79, longitude: 49.12, isCurrentLocation: false };

describe('экран городов: компоненты', () => {
  it.each(citiesList.map((vm) => [vm.name, vm] as const))('CityCard %s', async (_name, vm) => {
    const onPress = jest.fn();
    await inNight(<CityCard {...vm} onPress={onPress} />);
    expect(screen.getByText(vm.name)).toBeTruthy();
    expect(screen.getByText(vm.range)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(vm.a11y));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('SearchField: плейсхолдер и ввод', async () => {
    const onChangeText = jest.fn();
    await inNight(<SearchField value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Поиск города'), 'Каз');
    expect(onChangeText).toHaveBeenCalledWith('Каз');
    expect(screen.getByPlaceholderText('Найти город или аэропорт')).toBeTruthy();
  });

  it('SearchResults: новый и уже добавленный город', async () => {
    const onPick = jest.fn();
    const results = [
      { city: kazan, sub: 'Татарстан, Россия' },
      { city: { ...kazan, id: 'geo:1', name: 'Москва' }, sub: 'Москва, Россия' },
    ];
    await inNight(<SearchResults search={{ status: 'done', results }} addedIds={new Set(['geo:1'])} onPick={onPick} />);
    expect(screen.getByText('Уже в списке')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Казань, Татарстан, Россия'));
    expect(onPick).toHaveBeenCalledWith(results[0]);
    expect(screen.getByLabelText('Москва, Москва, Россия, Уже в списке')).toBeTruthy();
  });

  it.each([
    ['done', 'Ничего не нашлось. Попробуйте другое название или код аэропорта.'],
    ['error', 'Поиск недоступен. Проверьте подключение.'],
    ['loading', 'Поиск…'],
  ] as const)('SearchResults без результатов, %s', async (status, text) => {
    await inNight(<SearchResults search={{ status, results: [] }} addedIds={new Set()} onPick={jest.fn()} />);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
