import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { TempHero } from '@/components/TempHero';
import { ENTRANCE_SHIFT, setEntrancePhase, useEntrance, type EntrancePhase } from '@/lib/entrance';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { scheduleSplash, STILL, T } from '../timeline';

afterEach(() => {
  jest.useRealTimers();
  setEntrancePhase('done');
});

describe('сценарий сплэша', () => {
  it('порядок событий: восход, название, появление экрана, раскрытие, уход сцены, конец', () => {
    expect(T.rise + T.riseDur).toBeLessThan(T.gate);
    expect(T.words[3] + T.wordDur).toBeLessThan(T.out);
    expect(T.gate).toBeLessThan(T.reveal);
    expect(T.reveal).toBeLessThan(T.out);
    expect(T.reveal + T.revealDur).toBeLessThanOrEqual(T.end);
    expect(T.out + T.sceneOutDur + 200).toBeLessThanOrEqual(T.end);
  });

  it('фазы появления переключаются по таймерам', () => {
    jest.useFakeTimers();
    const phases: EntrancePhase[] = [];
    scheduleSplash(false, (p) => phases.push(p));
    jest.advanceTimersByTime(T.gate - 1);
    expect(phases).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(phases).toEqual(['reveal']);
    jest.advanceTimersByTime(T.end - T.gate);
    expect(phases).toEqual(['reveal', 'done']);
  });

  it('при «Уменьшении движения» кадр стоит и гаснет', () => {
    jest.useFakeTimers();
    const phases: EntrancePhase[] = [];
    scheduleSplash(true, (p) => phases.push(p));
    jest.advanceTimersByTime(STILL.hold);
    expect(phases).toEqual(['reveal']);
    jest.advanceTimersByTime(STILL.fade);
    expect(phases).toEqual(['reveal', 'done']);
  });

  it('отмена снимает таймеры', () => {
    jest.useFakeTimers();
    const phases: EntrancePhase[] = [];
    const cancel = scheduleSplash(false, (p) => phases.push(p));
    cancel();
    jest.advanceTimersByTime(T.end);
    expect(phases).toEqual([]);
  });
});

function Probe() {
  const { ready, underSplash, shift } = useEntrance();
  return <Text>{`${ready}/${underSplash}/${shift}`}</Text>;
}

describe('ворота появления', () => {
  it('без сплэша появление сразу и без сдвига', async () => {
    await render(<Probe />);
    expect(screen.getByText('true/false/0')).toBeTruthy();
  });

  it('под сплэшем ждёт раскрытия; сдвиг не меняется после конца сплэша', async () => {
    setEntrancePhase('cover');
    await render(<Probe />);
    expect(screen.getByText(`false/true/${ENTRANCE_SHIFT}`)).toBeTruthy();
    await act(async () => setEntrancePhase('reveal'));
    expect(screen.getByText(`true/true/${ENTRANCE_SHIFT}`)).toBeTruthy();
    // иначе задержки поменяются и появление начнётся заново
    await act(async () => setEntrancePhase('done'));
    expect(screen.getByText(`true/true/${ENTRANCE_SHIFT}`)).toBeTruthy();
  });

  it('TempHero под сплэшем не начинает отсчёт: видно итоговое значение', async () => {
    setEntrancePhase('cover');
    await render(
      <ThemeProvider theme="day">
        <TempHero place="Москва" temp={8} condition="Небольшой дождь" high={9} low={4} active />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('8°')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });
});
