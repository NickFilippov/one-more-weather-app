import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HeroVM } from '@/features/weather/types';
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

/** Город, температура, состояние, диапазон дня. Ставится прямо на небо, без стекла. */
export function TempHero({ place, temp, condition, high, low, active }: Props) {
  const { c } = useTheme();
  const shown = useCountUp(temp, active);
  const textShadow = (alpha: number, radius: number, y: number) => ({
    textShadowColor: `rgba(0,0,0,${alpha})`,
    textShadowRadius: radius,
    textShadowOffset: { width: 0, height: y },
  });

  return (
    <View style={styles.root}>
      <Reveal>
        <Text style={[type.place, { color: c.text }, textShadow(0.12, 12, 1)]} maxFontSizeMultiplier={1.2}>
          {place}
        </Text>
      </Reveal>
      <Reveal delay={60} style={styles.temp}>
        <View accessible accessibilityLabel={formatTemp(temp)}>
          <Text style={[type.tempHero, { color: c.text }, textShadow(0.14, 24, 2)]} maxFontSizeMultiplier={1.2}>
            {formatTempNumber(shown)}
          </Text>
          {/* знак градуса висит справа и не сдвигает цифры от центра */}
          <Text style={[type.tempHero, styles.deg, { color: c.text }]} maxFontSizeMultiplier={1.2}>
            °
          </Text>
        </View>
      </Reveal>
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
