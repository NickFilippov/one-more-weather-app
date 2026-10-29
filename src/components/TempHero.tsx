import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { HeroVM } from '@/features/weather/types';
import { useEntrance, useEntranceOrigin } from '@/lib/entrance';
import { formatRangeHero, formatTemp, formatTempNumber } from '@/lib/format';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { duration } from '@/theme/tokens';
import { type } from '@/theme/typography';
import { Reveal } from './Reveal';

interface Props extends HeroVM {
  /** Страница видима и приложение активно: при первом показе температура отсчитывается от нуля. */
  active: boolean;
}

/**
 * Температура считает от 0 до значения один раз, при первом показе страницы (900 мс).
 * wait: страница ещё не показана, видно итоговое значение; run: идёт счёт; done: готово.
 */
function useCountUp(target: number, active: boolean): number {
  const reduce = useReduceMotion();
  const [state, setState] = useState<{ phase: 'wait' | 'run' | 'done'; value: number }>(() => ({
    phase: active ? 'run' : 'wait',
    value: 0,
  }));

  // Страница стала видимой в первый раз: запускаем счёт (корректировка состояния при рендере).
  if (active && state.phase === 'wait') setState({ phase: 'run', value: 0 });

  const running = state.phase === 'run';
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = reduce ? 1 : Math.min(1, (Date.now() - start) / duration.count);
      if (p >= 1) {
        setState({ phase: 'done', value: target });
        return;
      }
      setState({ phase: 'run', value: Math.round(target * (1 - Math.pow(1 - p, 4))) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, reduce, target]);

  return running ? state.value : target;
}

// Под сплэшем температура вылетает из точки восхода навстречу и садится с лёгким перелётом.
// Отсчёт идёт на лету: он начинается с раскрытием неба и кончается к посадке.
const FLIGHT = { delay: 250, travel: 665, settle: 285 };
const flightEase = Easing.bezier(0.3, 0.6, 0.35, 1);
const settleEase = Easing.bezier(0.34, 1.2, 0.64, 1);

function useFlyIn(ref: RefObject<ComponentRef<typeof View> | null>, enabled: boolean, ready: boolean) {
  const origin = useEntranceOrigin();
  const { height } = useWindowDimensions();
  const [center, setCenter] = useState<number | null>(null);
  // 0 — в точке восхода, 1 — перелёт над своим местом, 2 — на месте
  const t = useSharedValue(enabled ? 0 : 2);
  const dy = center === null ? 0 : (origin ?? height / 2) - center;
  const measured = center !== null;

  const onLayout = useCallback(() => {
    if (enabled) ref.current?.measureInWindow((_x, y, _w, h) => setCenter(y + h / 2));
  }, [enabled, ref]);

  useEffect(() => {
    if (!enabled || !ready || !measured) return;
    t.value = withDelay(
      FLIGHT.delay,
      withSequence(
        withTiming(1, { duration: FLIGHT.travel, easing: flightEase }),
        withTiming(2, { duration: FLIGHT.settle, easing: settleEase }),
      ),
    );
  }, [enabled, ready, measured, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(t.value, [0, 1], [dy, 0], Extrapolation.CLAMP) },
      { scale: interpolate(t.value, [0, 1, 2], [0.2, 1.07, 1]) },
    ],
  }));

  return { onLayout, style };
}

/** Город, температура, состояние, диапазон дня. Ставится прямо на небо, без стекла. */
export function TempHero({ place, temp, condition, high, low, active }: Props) {
  const { c } = useTheme();
  const reduce = useReduceMotion();
  const { ready, underSplash } = useEntrance();
  const flies = underSplash && !reduce;
  const numberRef = useRef<ComponentRef<typeof View>>(null);
  const fly = useFlyIn(numberRef, flies, ready);
  const shown = useCountUp(temp, active && ready);
  const textShadow = (alpha: number, radius: number, y: number) => ({
    textShadowColor: `rgba(0,0,0,${alpha})`,
    textShadowRadius: radius,
    textShadowOffset: { width: 0, height: y },
  });

  const number = (
    <View ref={numberRef} onLayout={fly.onLayout} accessible accessibilityLabel={formatTemp(temp)}>
      <Text style={[type.tempHero, { color: c.text }, textShadow(0.14, 24, 2)]} maxFontSizeMultiplier={1.2}>
        {formatTempNumber(shown)}
      </Text>
      {/* знак градуса висит справа и не сдвигает цифры от центра */}
      <Text style={[type.tempHero, styles.deg, { color: c.text }]} maxFontSizeMultiplier={1.2}>
        °
      </Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <Reveal>
        <Text style={[type.place, { color: c.text }, textShadow(0.12, 12, 1)]} maxFontSizeMultiplier={1.2}>
          {place}
        </Text>
      </Reveal>
      {flies ? (
        <Animated.View style={[styles.temp, fly.style]}>{number}</Animated.View>
      ) : (
        <Reveal delay={60} style={styles.temp}>
          {number}
        </Reveal>
      )}
      <Reveal delay={120}>
        <Text style={[type.headline, { color: c.text }]}>{condition}</Text>
      </Reveal>
      <Reveal delay={160} style={{ marginTop: 4 }}>
        <Text style={[type.rangeHero, { color: c.text }]}>{formatRangeHero(high, low)}</Text>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  temp: { marginTop: -8, marginBottom: -20 },
  deg: { position: 'absolute', left: '100%', top: 0 },
});
