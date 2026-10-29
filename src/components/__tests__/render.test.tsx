import { configure, render, screen } from '@testing-library/react-native';
import { DailyForecast } from '../DailyForecast';
import { HourlyForecast } from '../HourlyForecast';
import { PageDots } from '../PageDots';
import { StatePanel } from '../StatePanel';
import { TempHero } from '../TempHero';
import { Tiles } from '../Tiles';
import { WeatherIcon } from '../icons/WeatherIcon';
import { UiIcon } from '../icons/UiIcon';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { moscowRain, sochiStorm, spbNight } from '@/mocks/mainScreens';
import type { IconKind } from '@/features/weather/types';

// Блоки появляются анимацией с нулевой прозрачностью: в тестах она не идёт, элементы всё равно в дереве.
configure({ defaultIncludeHiddenElements: true });

const KINDS: IconKind[] = ['sun', 'moon', 'partly', 'cloud', 'rain', 'storm', 'snow'];

// В @testing-library/react-native 14 render асинхронный
const inTheme = (node: React.ReactElement, theme: 'day' | 'night' = 'day') =>
  render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

describe('компоненты рисуются без ошибок', () => {
  it.each(KINDS)('WeatherIcon %s', async (kind) => {
    await inTheme(<WeatherIcon kind={kind} />);
    expect(screen.getByRole('image')).toBeTruthy();
  });

  it('WeatherIcon: подпись по умолчанию и скрытие от диктора', async () => {
    await inTheme(<WeatherIcon kind="storm" />);
    expect(screen.getByLabelText('Гроза')).toBeTruthy();
  });

  it('WeatherIcon: с анимацией рисуется и размонтируется', async () => {
    jest.useFakeTimers();
    const { unmount } = await inTheme(<WeatherIcon kind="rain" animate />);
    expect(screen.getByLabelText('Дождь')).toBeTruthy();
    unmount();
    jest.useRealTimers();
  });

  it('UiIcon: все значки', async () => {
    for (const name of ['map', 'list', 'back', 'more', 'search'] as const) {
      await inTheme(<UiIcon name={name} color="#fff" />);
    }
  });

  it('TempHero: минус типографский, подпись — итоговое значение', async () => {
    await inTheme(<TempHero place="Новосибирск" temp={-2} condition="Ясно" high={1} low={-6} active={false} />, 'night');
    expect(screen.getByText('Новосибирск')).toBeTruthy();
    expect(screen.getByLabelText('−2°')).toBeTruthy();
    expect(screen.getByText('Макс.: 1°, мин.: −6°')).toBeTruthy();
  });

  it('Tiles: подпись, значение, единица, пояснение', async () => {
    await inTheme(<Tiles tiles={moscowRain.tiles} />);
    expect(screen.getByText('Ощущается как')).toBeTruthy();
    expect(screen.getByText('Из-за ветра кажется холоднее.')).toBeTruthy();
    expect(screen.getByLabelText('Ветер, 6 м/с. Северо-западный, порывы до 11 м/с.')).toBeTruthy();
  });

  it('Tiles: нечётное число плиток не падает', async () => {
    await inTheme(<Tiles tiles={moscowRain.tiles.slice(0, 1)} />);
    expect(screen.getByText('Ощущается как')).toBeTruthy();
  });

  it.each([
    ['moscowRain', moscowRain],
    ['spbNight', spbNight],
    ['sochiStorm', sochiStorm],
  ])('HourlyForecast и DailyForecast: %s', async (_name, vm) => {
    await inTheme(
      <>
        <HourlyForecast hours={vm.hours} summary={vm.summary} animateIcons={false} />
        <DailyForecast days={vm.days} min={vm.dayMin} max={vm.dayMax} animateIcons={false} />
      </>,
      vm.theme,
    );
    expect(screen.getByText(vm.summary)).toBeTruthy();
    expect(screen.getByText('Прогноз на 10 дней')).toBeTruthy();
    expect(screen.getByLabelText(vm.days[0].a11y)).toBeTruthy();
  });

  it('PageDots: подпись и окно при большом числе городов', async () => {
    await inTheme(<PageDots count={25} current={12} location label="Сочи, город 13 из 25" />);
    expect(screen.getByLabelText('Сочи, город 13 из 25')).toBeTruthy();
  });

  it('StatePanel: кнопка вызывает действие', async () => {
    const onPress = jest.fn();
    await inTheme(<StatePanel title="Не удалось загрузить погоду" text="Нет подключения к интернету." actions={[{ label: 'Повторить', onPress }]} />);
    expect(screen.getByText('Нет подключения к интернету.')).toBeTruthy();
    expect(screen.getByLabelText('Повторить')).toBeTruthy();
  });
});
