import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import type { IconKind } from '@/features/weather/types';
import { useLoopValue } from '@/lib/useLoopValue';
import { ease } from '@/theme/motion';
import { useTheme } from '@/theme/ThemeProvider';

export const ICON_LABELS: Record<IconKind, string> = {
  sun: 'Ясно',
  moon: 'Ясно, ночь',
  cloud: 'Облачно',
  partly: 'Переменная облачность',
  rain: 'Дождь',
  storm: 'Гроза',
  snow: 'Снег',
};

interface Props {
  kind: IconKind;
  size?: number;
  /** Подпись для диктора; в ленте и строке дня её читает родитель, там не нужна. */
  label?: string;
  accessible?: boolean;
  /** Видимая страница, приложение активно, «Уменьшение движения» выключено. */
  animate?: boolean;
}

/** Главное движение иконки: какой частью и с каким циклом. Луна стоит. */
const MOTION: Record<IconKind, { ms: number; reverse: boolean } | null> = {
  sun: { ms: 24000, reverse: false }, // лучи вращаются
  partly: { ms: 6000, reverse: true }, // облако покачивается
  cloud: { ms: 6000, reverse: true },
  rain: { ms: 1100, reverse: false }, // капли падают по очереди
  snow: { ms: 2400, reverse: false }, // снежинки падают по очереди
  storm: { ms: 3200, reverse: false }, // молния вспыхивает
  moon: null,
};

/** Падение капли или снежинки, как в макете: от `from` до `to`, видна полностью на `peak` цикла. */
const FALL = { rain: { from: -3, to: 5, peak: 0.25 }, snow: { from: -2, to: 5, peak: 0.3 } };

/** У дождя, снега и грозы облако ещё и покачивается своим циклом. */
const BOBS: ReadonlySet<IconKind> = new Set(['rain', 'snow', 'storm']);

export function WeatherIcon({ kind, size = 28, label, accessible = true, animate = false }: Props) {
  const { c } = useTheme();
  const motion = MOTION[kind];
  // покачивание туда-обратно плавное, вращение и падение равномерные
  const v = useLoopValue(animate && motion != null, motion?.ms ?? 1000, {
    reverse: motion?.reverse,
    easing: motion?.reverse ? ease.drift : Easing.linear,
  });
  const k = size / 32;
  const bob = useLoopValue(animate && BOBS.has(kind), 6000, { reverse: true, easing: ease.drift });
  const cloudStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (-0.6 + 1.4 * bob.value) * k }] }));
  const fall = kind === 'rain' || kind === 'snow' ? FALL[kind] : null;
  // три капли на одном цикле, каждая сдвинута на треть: падают вразнобой
  const drop0 = useFall(v, 0, animate && fall != null, k, fall);
  const drop1 = useFall(v, 1, animate && fall != null, k, fall);
  const drop2 = useFall(v, 2, animate && fall != null, k, fall);

  // Главная движущаяся часть иконки
  const moving = useAnimatedStyle(() => {
    switch (kind) {
      case 'sun':
        return { transform: [{ rotate: `${v.value * 360}deg` }] };
      case 'cloud':
      case 'partly':
        return { transform: [{ translateX: (-0.6 + 1.4 * v.value) * k }] };
      case 'storm':
        return { opacity: animate && v.value > 0.64 && v.value < 0.68 ? 0.25 : 1 };
      default:
        return {};
    }
  });

  let still: ReactNode = null;
  let moves: ReactNode = null;
  let bobbing: ReactNode = null;
  let drops: ReactNode[] = [];
  switch (kind) {
    case 'sun':
      still = <Circle cx={16} cy={16} r={6} fill={c.sun} />;
      moves = <Rays cx={16} cy={16} r1={9.5} r2={12.5} color={c.sun} />;
      break;
    case 'moon':
      still = <Path d="M19.5 5.5a10.5 10.5 0 1 0 7 17.6A8.6 8.6 0 0 1 19.5 5.5z" fill={c.textMuted} />;
      break;
    case 'cloud':
      moves = <CloudShape y={8} fill={c.text} />;
      break;
    case 'partly':
      still = (
        <>
          <Circle cx={11} cy={11} r={5} fill={c.sun} />
          <Rays cx={11} cy={11} r1={7.5} r2={9.8} color={c.sun} />
        </>
      );
      moves = (
        <G transform="translate(3 5)">
          <CloudShape y={8} fill={c.text} />
        </G>
      );
      break;
    case 'rain':
      bobbing = <CloudShape y={3} fill={c.text} />;
      drops = [10, 16, 22].map((x) => (
        <Line key={x} x1={x} y1={23} x2={x - 1} y2={27} stroke={c.rain} strokeWidth={2} strokeLinecap="round" />
      ));
      break;
    case 'snow':
      bobbing = <CloudShape y={3} fill={c.text} />;
      drops = [
        <Circle key={0} cx={10} cy={25} r={1.5} fill={c.text} />,
        <Circle key={1} cx={16} cy={26} r={1.5} fill={c.text} />,
        <Circle key={2} cx={22} cy={25} r={1.5} fill={c.text} />,
      ];
      break;
    case 'storm':
      bobbing = <CloudShape y={3} fill={c.text} />;
      moves = <Path d="M17 19l-5 7h4l-1.5 5L20 23.5h-4l1.5-4.5z" fill={c.sun} />;
      break;
  }

  return (
    <View
      style={{ width: size, height: size }}
      accessible={accessible}
      accessibilityRole="image"
      accessibilityLabel={accessible ? (label ?? ICON_LABELS[kind]) : undefined}
      importantForAccessibility={accessible ? 'yes' : 'no-hide-descendants'}
    >
      {still ? <Layer size={size}>{still}</Layer> : null}
      {bobbing ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, cloudStyle]}>
          <Layer size={size}>{bobbing}</Layer>
        </Animated.View>
      ) : null}
      {drops.map((d, i) => (
        <Animated.View key={i} pointerEvents="none" style={[StyleSheet.absoluteFill, [drop0, drop1, drop2][i]]}>
          <Layer size={size}>{d}</Layer>
        </Animated.View>
      ))}
      {moves ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, moving]}>
          <Layer size={size}>{moves}</Layer>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Одна капля или снежинка: свой сдвиг фазы на общем цикле падения. */
function useFall(v: SharedValue<number>, i: number, on: boolean, k: number, fall: { from: number; to: number; peak: number } | null) {
  return useAnimatedStyle(() => {
    if (!on || !fall) return { opacity: 1, transform: [{ translateY: 0 }] };
    const p = (v.value + i / 3) % 1;
    const opacity = p < fall.peak ? p / fall.peak : 1 - (p - fall.peak) / (1 - fall.peak);
    return { opacity, transform: [{ translateY: (fall.from + (fall.to - fall.from) * p) * k }] };
  });
}

/** Слой иконки: свой Svg того же размера, чтобы неподвижная и движущаяся части лежали друг на друге. */
function Layer({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}>
      {children}
    </Svg>
  );
}

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

function Rays({ cx, cy, r1, r2, color }: { cx: number; cy: number; r1: number; r2: number; color: string }) {
  return (
    <G stroke={color} strokeWidth={2} strokeLinecap="round">
      {RAYS.map((a) => {
        const rad = (a * Math.PI) / 180;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        return <Line key={a} x1={cx + c * r1} y1={cy + s * r1} x2={cx + c * r2} y2={cy + s * r2} />;
      })}
    </G>
  );
}

function CloudShape({ y, fill }: { y: number; fill: string }) {
  return (
    <G fill={fill}>
      <Rect x={5} y={y + 6} width={22} height={9} rx={4.5} />
      <Circle cx={11.5} cy={y + 7.5} r={5} />
      <Circle cx={18.5} cy={y + 5} r={7} />
    </G>
  );
}
