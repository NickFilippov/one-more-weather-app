import { useEffect, useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

interface Drops {
  x: number[];
  y: number[];
  len: number[];
  v: number[];
}

// Три слоя по глубине z: дальние тоньше и прозрачнее. alpha = .18 + z·.45, толщина 1.4 при alpha > .45
const LAYERS = [
  { from: 0, to: 1 / 3, alpha: 0.26, width: 1 },
  { from: 1 / 3, to: 2 / 3, alpha: 0.42, width: 1 },
  { from: 2 / 3, to: 1.0001, alpha: 0.62, width: 1.4 },
];

function makeDrops(W: number, H: number, intensity: number): Drops[] {
  const n = Math.round(((W * H) / 2600) * intensity);
  const layers: Drops[] = LAYERS.map(() => ({ x: [], y: [], len: [], v: [] }));
  for (let i = 0; i < n; i++) {
    const z = Math.random();
    const layer = layers[LAYERS.findIndex((l) => z >= l.from && z < l.to)];
    layer.x.push(Math.random() * (W + 60));
    layer.y.push(Math.random() * H);
    layer.len.push(8 + z * 14);
    layer.v.push(7 + z * 9);
  }
  return layers;
}

function mod(a: number, b: number): number {
  'worklet';
  return ((a % b) + b) % b;
}

interface Props {
  W: number;
  H: number;
  intensity: number;
  running: boolean;
  color: string;
}

/** Порт RainCanvas из дизайн-системы: капли падают с наклоном, позиция считается от времени. */
export function Rain({ W, H, intensity, running, color }: Props) {
  const drops = useMemo(() => makeDrops(W, H, intensity), [W, H, intensity]);
  const t = useSharedValue(0); // кадры по 60 Гц

  // Накапливаем время, а не берём от первого кадра: после паузы капли не прыгают назад.
  const frame = useFrameCallback((info) => {
    t.value += (info.timeSincePreviousFrame ?? 16.67) / 16.67;
  }, false);
  useEffect(() => {
    frame.setActive(running);
    return () => frame.setActive(false);
  }, [frame, running]);

  return (
    <>
      {LAYERS.map((layer, li) => (
        <RainLayer key={li} drops={drops[li]} W={W} H={H} t={t} color={color} alpha={layer.alpha} width={layer.width} />
      ))}
    </>
  );
}

function RainLayer({
  drops,
  W,
  H,
  t,
  color,
  alpha,
  width,
}: {
  drops: Drops;
  W: number;
  H: number;
  t: SharedValue<number>;
  color: string;
  alpha: number;
  width: number;
}) {
  const path = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    const n = drops.x.length;
    for (let i = 0; i < n; i++) {
      const y = mod(drops.y[i] + drops.v[i] * t.value, H + 40) - 20;
      const x = mod(drops.x[i] - drops.v[i] * 0.18 * t.value, W + 60);
      b.moveTo(x, y);
      b.lineTo(x - drops.len[i] * 0.18, y + drops.len[i]);
    }
    return b.build();
  });
  return <Path path={path} style="stroke" strokeWidth={width} strokeCap="round" color={color} opacity={alpha} />;
}
