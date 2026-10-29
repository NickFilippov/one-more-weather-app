import { StyleSheet } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import type { Condition } from '@/features/weather/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Clouds } from './Clouds';
import { Glow } from './Glow';
import { Rain } from './Rain';

export interface SkyCanvasProps {
  condition: Condition;
  width: number;
  height: number;
  running: boolean;
}

/** Всё, что рисует Skia: свечение, облака, дождь. */
export function SkyCanvas({ condition, width, height, running }: SkyCanvasProps) {
  // Canvas Skia — отдельный рендерер: React-контекст внутрь не проходит, цвета берём здесь и передаём пропсами.
  const { c, name } = useTheme();
  const sunny = condition === 'clear' || condition === 'partly';
  const cloudCount = condition === 'clear' ? 0 : condition === 'partly' ? 2 : 3;
  const rainy = condition === 'rain' || condition === 'storm';
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {sunny && <Glow width={width} running={running} color={name === 'night' ? c.textMuted : c.sun} night={name === 'night'} />}
      {cloudCount > 0 && <Clouds W={width} H={height} count={cloudCount} running={running} color={c.glassEdge} />}
      {rainy && <Rain W={width} H={height} intensity={condition === 'storm' ? 1.6 : 1} running={running} color={c.rain} />}
    </Canvas>
  );
}
