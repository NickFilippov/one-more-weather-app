import { Circle, Group, RadialGradient, vec, Blur } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { ease } from '@/theme/motion';
import { useLoopValue } from '@/lib/useLoopValue';

interface Props {
  width: number;
  running: boolean;
  /** sun днём, textMuted ночью. Цвета приходят пропсами: контекст внутрь Canvas не доходит. */
  color: string;
  night: boolean;
}

/** Солнце днём и луна ночью: свечение в верхнем правом углу, центр на верхнем крае. */
export function Glow({ width, running, color, night }: Props) {
  const v = useLoopValue(running, 9000, { reverse: true, easing: ease.drift });
  const cx = width * 0.8;
  const r = width * 0.35;
  const transform = useDerivedValue(() => [{ scale: 1 + 0.12 * v.value }]);
  return (
    <Group opacity={night ? 0.16 : 0.4} transform={transform} origin={vec(cx, 0)}>
      <Circle cx={cx} cy={0} r={r}>
        {/* CSS radial-gradient(circle, c 0%, transparent 62%) в квадрате: 62% от половины диагонали */}
        <RadialGradient c={vec(cx, 0)} r={r * 0.877} colors={[color, 'transparent']} />
        <Blur blur={8} />
      </Circle>
    </Group>
  );
}
