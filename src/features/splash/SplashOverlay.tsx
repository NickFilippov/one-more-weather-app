import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, Circle, Group, RadialGradient, Rect, rect, vec } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCitiesStore } from '@/features/cities/citiesStore';
import { themeOf } from '@/features/weather/model/viewModels';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { setEntranceOrigin, setEntrancePhase, useEntrancePhase } from '@/lib/entrance';
import { font } from '@/theme/fonts';
import { curve } from '@/theme/motion';
import { colors } from '@/theme/tokens';
import { scheduleStillSplash, STILL, T } from './timeline';

/** На телефонах сплэш анимированный; в веб-превью его нет (SplashOverlay.web.tsx). */
export const animatedSplash = true;

// Кадр нативной заставки. assets/splash-icon.png рисует scripts/splash-icon.mjs с теми же размерами:
// горизонт 120×2 и солнце 28 в центре экрана, поэтому подмена нативного сплэша не видна.
const NIGHT = colors.night.skyBottom; // backgroundColor сплэша в app.json
const CLEAR = 'rgba(7,13,36,0)';
const PALE = '#f4f7ff';
const HORIZON = ['rgba(244,247,255,0)', 'rgba(244,247,255,0.9)', 'rgba(244,247,255,0)'] as const;
const HORIZON_W = 120;
const SUN_D = 28;
const RISE = 34;
// Шаг часов сплэша за кадр, мс: два кадра при 60 Гц
const MAX_STEP = 34;

// Сцена уходит с ускорением; тьма отступает плавно
const away = Easing.bezierFn(0.55, 0, 0.75, 0.3);
const recede = Easing.bezierFn(0.5, 0, 0.6, 1);

/** Прогресс отрезка [from, from + dur] на часах сплэша, 0…1. */
function seg(t: number, from: number, dur: number): number {
  'worklet';
  return Math.min(1, Math.max(0, (t - from) / dur));
}

/** Солнце днём, луна ночью: по теме первой страницы, с которой откроется главный экран. */
function useOrbColor(): string {
  const first = useCitiesStore((s) => s.currentLocation ?? s.saved[0] ?? null);
  const forecast = useWeatherStore((s) => (first ? s.entries[first.id] : undefined));
  return forecast && themeOf(forecast) === 'day' ? colors.day.sun : colors.night.textMuted;
}

// Если система не ответила про «Уменьшение движения», анимация не ждёт дольше этого
const REDUCE_QUERY_TIMEOUT = 300;

function queryReduceMotion(): Promise<boolean> {
  return Promise.race([
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), REDUCE_QUERY_TIMEOUT)),
  ]);
}

/**
 * Сплэш «Восход» поверх приложения. Начинается с кадра нативной заставки, прячет её и играет:
 * восход, название по словам, затем небо раскрывается от точки восхода. Главный экран
 * под ним уже смонтирован и появляется по фазам из src/lib/entrance.ts.
 */
interface Props {
  /** Шрифт названия загружен: до этого слова не рисуются. */
  fontsReady: boolean;
  /** Главный экран смонтирован и нарисован: после паузы `hold` можно продолжать. */
  mainReady: boolean;
  /** Пора монтировать главный экран: кадр сплэша собран и неподвижен. */
  onMountMain: () => void;
}

export function SplashOverlay({ fontsReady, mainReady, onMountMain }: Props) {
  const phase = useEntrancePhase();
  const orb = useOrbColor();
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [still, setStill] = useState(false);
  const [held, setHeld] = useState(false);
  const [holdTimedOut, setHoldTimedOut] = useState(false);
  const t = useSharedValue(0);
  const fade = useSharedValue(1);
  // До паузы hold часы идут сами; дальше — только когда главный экран готов
  const pastHold = useSharedValue(false);
  const laidOut = size !== null;

  // Монтаж главного экрана занимает поток отрисовки (замер 2026-10-29, release на симуляторах:
  // iOS около 1.2 с, Android 1–2.5 с). Во время восхода анимация от этого замирала на полуслове,
  // поэтому экран монтируется в паузе hold, когда кадр собран и неподвижен.
  const reachHold = useCallback(() => {
    setHeld(true);
    onMountMain();
  }, [onMountMain]);

  // Покадровые часы: за кадр не больше MAX_STEP. Если поток отрисовки завис (первый холст Skia,
  // монтаж главного экрана), анимация встаёт и продолжает с того же места, а не перескакивает.
  // Фазы появления тоже идут по этим часам: по настенному таймеру слой снимался посреди ухода сцены.
  const clock = useFrameCallback((frame) => {
    const step = Math.min(frame.timeSincePreviousFrame ?? 16, MAX_STEP);
    const prev = t.value;
    const next = Math.min(prev + step, pastHold.value ? T.end : T.hold);
    t.value = next;
    if (prev < T.hold && next >= T.hold) scheduleOnRN(reachHold);
    if (prev < T.gate && next >= T.gate) scheduleOnRN(setEntrancePhase, 'reveal');
    if (prev < T.end && next >= T.end) scheduleOnRN(setEntrancePhase, 'done');
  }, false);

  // Восход и название: начинаются сразу, без ожидания, неподвижный кадр выглядит как зависание
  useEffect(() => {
    if (!laidOut) return;
    let alive = true;
    let cancel = () => {};
    clock.setActive(true);
    // Слой уже нарисован и выглядит как нативная заставка: прячем её
    const frame = requestAnimationFrame(() => SplashScreen.hide());
    void queryReduceMotion().then((reduce) => {
      if (!alive || !reduce) return;
      // «Уменьшение движения»: возвращаем кадр заставки, он стоит и гаснет
      clock.setActive(false);
      t.set(0);
      setStill(true);
      onMountMain();
      fade.set(withDelay(STILL.hold, withTiming(0, { duration: STILL.fade })));
      cancel = scheduleStillSplash(setEntrancePhase);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      cancel();
    };
  }, [laidOut, t, fade, onMountMain]); // eslint-disable-line react-hooks/exhaustive-deps -- clock стабилен

  // Пауза не дольше maxHold: если главный экран не ответил, сплэш всё равно уходит
  useEffect(() => {
    if (!held) return;
    const timer = setTimeout(() => setHoldTimedOut(true), T.maxHold);
    return () => clearTimeout(timer);
  }, [held]);

  // Главный экран нарисован: камера поднимает взгляд, небо раскрывается
  const proceed = held && (mainReady || holdTimedOut);
  useEffect(() => {
    if (proceed) pastHold.set(true);
  }, [proceed, pastHold]);

  // Слой сняли раньше времени: экран под ним не должен остаться невидимым
  useEffect(() => () => setEntrancePhase('done'), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setEntranceOrigin(height / 2);
    setSize({ w: width, h: height });
  };

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  // Подложка нужна, пока Skia не нарисовал первый кадр; с раскрытием неба остаётся только маска холста
  const baseStyle = useAnimatedStyle(() => ({ opacity: t.value < T.reveal ? 1 : 0 }));
  const horizonStyle = useAnimatedStyle(() => {
    const rise = curve.glass(seg(t.value, T.rise, T.riseDur));
    const out = away(seg(t.value, T.out, T.sceneOutDur));
    return { opacity: 1 - out, transform: [{ translateY: 320 * out }, { scaleX: 1 + 2.6 * rise + 1.4 * out }] };
  });
  const sunStyle = useAnimatedStyle(() => ({
    opacity: 1 - seg(t.value, T.out, 300),
    transform: [{ translateY: -RISE * curve.glass(seg(t.value, T.rise, T.riseDur)) }],
  }));
  const nameStyle = useAnimatedStyle(() => {
    const out = away(seg(t.value, T.out, T.nameOutDur));
    return { opacity: 1 - out, transform: [{ translateY: 48 * out }] };
  });

  if (phase === 'done') return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, rootStyle]}
      pointerEvents={phase === 'cover' ? 'auto' : 'none'}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: NIGHT }, baseStyle]} />
      {size && (
        <>
          <SunriseSky t={t} w={size.w} h={size.h} orb={orb} />
          <Animated.View
            style={[styles.horizon, { left: (size.w - HORIZON_W) / 2, top: size.h / 2 - 1 }, horizonStyle]}
          >
            <LinearGradient colors={HORIZON} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          {/* солнце видно только над горизонтом */}
          <View style={[styles.clip, { height: size.h / 2 }]}>
            <Animated.View style={[styles.sun, { left: (size.w - SUN_D) / 2, top: (size.h - SUN_D) / 2 }, sunStyle]} />
          </View>
        </>
      )}
      {fontsReady && (
        <Animated.View style={[styles.name, { bottom: Math.max(insets.bottom, 28) + 84 }, nameStyle]}>
          <Word t={t} start={T.words[0]} still={still}>One</Word>
          <Word t={t} start={T.words[1]} still={still}>More</Word>
          <Word t={t} start={T.words[2]} still={still} accent>
            Weather
          </Word>
          <Word t={t} start={T.words[3]} still={still}>App</Word>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Слово названия всплывает снизу; Weather — с пружинкой и небольшим наклоном. */
function Word({
  t,
  start,
  still,
  accent,
  children,
}: {
  t: SharedValue<number>;
  start: number;
  still: boolean;
  accent?: boolean;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: 1, transform: [] };
    if (accent) {
      const p = curve.spring(seg(t.value, start, T.accentDur));
      return {
        opacity: Math.min(1, p),
        transform: [{ translateY: 28 * (1 - p) }, { rotate: `${-6 * (1 - p)}deg` }, { scale: 0.9 + 0.1 * p }],
      };
    }
    const p = curve.glass(seg(t.value, start, T.wordDur));
    return { opacity: p, transform: [{ translateY: 22 * (1 - p) }] };
  });
  return (
    <Animated.Text style={[styles.word, accent && styles.accent, style]} maxFontSizeMultiplier={1}>
      {children}
    </Animated.Text>
  );
}

/** Всё, что рисует Skia: маска тьмы, свет вдоль горизонта, ореол солнца и солнце, летящее в угол. */
function SunriseSky({ t, w, h, orb }: { t: SharedValue<number>; w: number; h: number; orb: string }) {
  const cx = w / 2;
  const cy = h / 2;
  const reach = Math.hypot(cx, cy) + 180;

  // Тьма отступает от точки восхода: прозрачный круг с мягким краем 160
  const r = useDerivedValue(() => Math.max(1, reach * recede(seg(t.value, T.reveal, T.revealDur))));
  const stops = useDerivedValue(() => [0, Math.max(0, (r.value - 160) / r.value), 1]);

  // Свет вдоль горизонта: эллипс 600×220, при подъёме взгляда уходит вниз и тает
  const dawnOpacity = useDerivedValue(
    () => 0.42 * curve.glass(seg(t.value, T.rise, T.riseDur)) * (1 - away(seg(t.value, T.out, T.sceneOutDur))),
  );
  const dawnTransform = useDerivedValue(() => {
    const rise = curve.glass(seg(t.value, T.rise, T.riseDur));
    const out = away(seg(t.value, T.out, T.sceneOutDur));
    const grow = 1 + 0.6 * out;
    return [
      { translateY: 300 * out },
      { scaleX: (300 / 110) * (0.35 + 0.65 * rise) * grow },
      { scaleY: (0.5 + 0.5 * rise) * grow },
    ];
  });

  // Ореол поднимается вместе с солнцем
  const haloC = useDerivedValue(() => vec(cx, cy - RISE * curve.glass(seg(t.value, T.rise, T.riseDur))));
  const haloOpacity = useDerivedValue(
    () => 0.9 * curve.glass(seg(t.value, T.rise, T.riseDur)) * (1 - seg(t.value, T.out, 400)),
  );

  // Солнце летит в правый верхний угол и становится свечением неба (центр 0.8w на верхнем крае, r 0.35w)
  const flyP = useDerivedValue(() => curve.glass(seg(t.value, T.out, 700)));
  const flyC = useDerivedValue(() => vec(cx + (0.8 * w - cx) * flyP.value, (cy - RISE) * (1 - flyP.value)));
  const flyR = useDerivedValue(() => {
    const appear = seg(t.value, T.out - 100, 100);
    return 0.35 * w * (0.35 + 0.07 * appear + 0.58 * flyP.value);
  });
  const flyGradientR = useDerivedValue(() => flyR.value * 0.877);
  const flyOpacity = useDerivedValue(
    () => (0.95 - 0.1 * flyP.value) * seg(t.value, T.out - 100, 100) * (1 - seg(t.value, T.out + 700, 200)),
  );

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={w} height={h}>
        <RadialGradient c={vec(cx, cy)} r={r} colors={[CLEAR, CLEAR, NIGHT]} positions={stops} />
      </Rect>
      <Group opacity={dawnOpacity} transform={dawnTransform} origin={vec(cx, cy)}>
        <Circle cx={cx} cy={cy} r={110}>
          <RadialGradient c={vec(cx, cy)} r={110} colors={[orb, 'transparent']} />
        </Circle>
      </Group>
      <Group clip={rect(0, 0, w, cy)}>
        <Circle c={haloC} r={64} opacity={haloOpacity}>
          <RadialGradient c={haloC} r={64} colors={[orb, 'transparent']} />
        </Circle>
      </Group>
      <Circle c={flyC} r={flyR} opacity={flyOpacity}>
        <RadialGradient c={flyC} r={flyGradientR} colors={[orb, 'transparent']} />
      </Circle>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  horizon: { position: 'absolute', width: HORIZON_W, height: 2 },
  clip: { position: 'absolute', left: 0, top: 0, right: 0, overflow: 'hidden' },
  sun: {
    position: 'absolute',
    width: SUN_D,
    height: SUN_D,
    borderRadius: SUN_D / 2,
    backgroundColor: PALE,
    boxShadow: '0 0 18px rgba(244,247,255,0.45)',
  },
  name: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 9 },
  word: { fontFamily: font.light, fontSize: 30, lineHeight: 36, letterSpacing: -0.3, color: colors.day.text },
  accent: {
    fontFamily: font.semibold,
    color: colors.day.sun,
    textShadowColor: 'rgba(255,211,107,0.45)',
    textShadowRadius: 22,
    textShadowOffset: { width: 0, height: 0 },
  },
});
