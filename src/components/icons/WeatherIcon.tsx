import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import type { IconKind } from '@/features/weather/types';
import { ease } from '@/theme/motion';
import { useLoopValue } from '@/lib/useLoopValue';
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

/** Один слой иконки: свой Svg того же размера, анимируется обёртка. */
function Layer({ size, style, children }: { size: number; style?: object; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox="0 0 32 32" style={{ overflow: 'visible' }}>
        {children}
      </Svg>
    </Animated.View>
  );
}

function useBob(animate: boolean, k: number): object {
  const v = useLoopValue(animate, 6000, { reverse: true, easing: ease.drift });
  return useAnimatedStyle(() => ({ transform: [{ translateX: (-0.6 + 1.4 * v.value) * k }] }));
}

function useDrop(animate: boolean, k: number, i: number, fall: number, ms: number, phaseStep: number): object {
  const v = useLoopValue(animate, ms, { phase: (i * phaseStep) % 1 });
  return useAnimatedStyle(() => {
    if (!animate) return { opacity: 1 };
    const o = v.value < 0.25 ? v.value / 0.25 : 1 - (v.value - 0.25) / 0.75;
    return { opacity: o, transform: [{ translateY: (-3 + (fall + 3) * v.value) * k }] };
  });
}

export function WeatherIcon({ kind, size = 28, label, accessible = true, animate = false }: Props) {
  const { c } = useTheme();
  const k = size / 32;

  const spin = useLoopValue(animate, 24000, { easing: Easing.linear });
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const bob = useBob(animate, k);
  const drop0 = useDrop(animate, k, 0, 5, 1100, 0);
  const drop1 = useDrop(animate, k, 1, 5, 1100, 0.337);
  const drop2 = useDrop(animate, k, 2, 5, 1100, 0.673);
  const flake0 = useDrop(animate, k, 0, 5, 2400, 0);
  const flake1 = useDrop(animate, k, 1, 5, 2400, 0.333);
  const flake2 = useDrop(animate, k, 2, 5, 2400, 0.667);
  const flash = useLoopValue(animate, 3200);
  const flashStyle = useAnimatedStyle(() => ({ opacity: animate && flash.value > 0.64 && flash.value < 0.68 ? 0.25 : 1 }));

  let layers: ReactNode;
  switch (kind) {
    case 'sun':
      layers = (
        <>
          <Layer size={size}>
            <Circle cx={16} cy={16} r={6} fill={c.sun} />
          </Layer>
          <Layer size={size} style={spinStyle}>
            <Rays cx={16} cy={16} r1={9.5} r2={12.5} color={c.sun} />
          </Layer>
        </>
      );
      break;
    case 'moon':
      layers = (
        <Layer size={size}>
          <Path d="M19.5 5.5a10.5 10.5 0 1 0 7 17.6A8.6 8.6 0 0 1 19.5 5.5z" fill={c.textMuted} />
        </Layer>
      );
      break;
    case 'cloud':
      layers = (
        <Layer size={size} style={bob}>
          <CloudShape y={8} fill={c.text} />
        </Layer>
      );
      break;
    case 'partly':
      layers = (
        <>
          <Layer size={size}>
            <Circle cx={11} cy={11} r={5} fill={c.sun} />
          </Layer>
          <Layer size={size} style={[spinStyle, { transformOrigin: '34.375% 34.375%' }]}>
            <Rays cx={11} cy={11} r1={7.5} r2={9.8} color={c.sun} />
          </Layer>
          <Layer size={size} style={bob}>
            <G transform="translate(3 5)">
              <CloudShape y={8} fill={c.text} />
            </G>
          </Layer>
        </>
      );
      break;
    case 'rain':
      layers = (
        <>
          <Layer size={size} style={bob}>
            <CloudShape y={3} fill={c.text} />
          </Layer>
          {[
            { x1: 10, x2: 9, st: drop0 },
            { x1: 16, x2: 15, st: drop1 },
            { x1: 22, x2: 21, st: drop2 },
          ].map((d, i) => (
            <Layer key={i} size={size} style={d.st}>
              <Line x1={d.x1} y1={23} x2={d.x2} y2={27} stroke={c.rain} strokeWidth={2} strokeLinecap="round" />
            </Layer>
          ))}
        </>
      );
      break;
    case 'storm':
      layers = (
        <>
          <Layer size={size} style={bob}>
            <CloudShape y={3} fill={c.text} />
          </Layer>
          <Layer size={size} style={flashStyle}>
            <Path d="M17 19l-5 7h4l-1.5 5L20 23.5h-4l1.5-4.5z" fill={c.sun} />
          </Layer>
        </>
      );
      break;
    case 'snow':
      layers = (
        <>
          <Layer size={size} style={bob}>
            <CloudShape y={3} fill={c.text} />
          </Layer>
          {[
            { cx: 10, cy: 25, st: flake0 },
            { cx: 16, cy: 26, st: flake1 },
            { cx: 22, cy: 25, st: flake2 },
          ].map((f, i) => (
            <Layer key={i} size={size} style={f.st}>
              <Circle cx={f.cx} cy={f.cy} r={1.5} fill={c.text} />
            </Layer>
          ))}
        </>
      );
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
      {layers}
    </View>
  );
}

