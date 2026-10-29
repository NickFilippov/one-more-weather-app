import { Blur, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { ease } from '@/theme/motion';
import { useLoopValue } from '@/lib/useLoopValue';

// Позиции в долях экрана и длительность цикла дрейфа (docs/tech/04-ui-spec.md)
const CLOUDS = [
  { left: -0.2, top: 0.06, w: 0.8, h: 0.22, cycle: 52000 },
  { left: 0.4, top: 0.18, w: 0.9, h: 0.26, cycle: 64000 },
  { left: -0.1, top: 0.44, w: 0.7, h: 0.2, cycle: 58000 },
];

interface CloudProps {
  W: number;
  H: number;
  spec: (typeof CLOUDS)[number];
  index: number;
  running: boolean;
  color: string;
}

function Cloud({ W, H, spec, index, running, color }: CloudProps) {
  const v = useLoopValue(running, spec.cycle, { reverse: true, easing: ease.drift, phase: (index * 11000) / spec.cycle / 2 });
  const w = spec.w * W;
  const h = spec.h * H;
  const cx = spec.left * W + w / 2;
  const cy = spec.top * H + h / 2;
  // сдвиг от −8% до +10% ширины облака
  const transform = useDerivedValue(() => [{ translateX: (-0.08 + 0.18 * v.value) * w }]);
  // эллипс = круг радиуса w/2, сжатый по вертикали
  const matrix = [{ translateX: cx }, { translateY: cy }, { scaleY: h / w }];
  return (
    <Group transform={transform}>
      <Group transform={matrix}>
        <Circle cx={0} cy={0} r={w / 2}>
          <RadialGradient c={vec(0, 0)} r={w / 2} colors={[color, 'transparent']} />
          <Blur blur={18} />
        </Circle>
      </Group>
    </Group>
  );
}

export function Clouds({ W, H, count, running, color }: { W: number; H: number; count: number; running: boolean; color: string }) {
  return (
    <>
      {CLOUDS.slice(0, count).map((spec, i) => (
        <Cloud key={i} W={W} H={H} spec={spec} index={i} running={running} color={color} />
      ))}
    </>
  );
}
