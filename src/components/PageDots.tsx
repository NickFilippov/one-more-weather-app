import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  count: number;
  current: number;
  /** Первая позиция — стрелка «Моё местоположение». */
  location: boolean;
  label: string;
}

const MAX_DOTS = 10; // Q-15: больше десяти показываем окном вокруг текущей

export function PageDots({ count, current, location, label }: Props) {
  const { c } = useTheme();
  const total = Math.max(count, 1);
  const first = total > MAX_DOTS ? Math.min(Math.max(current - Math.floor(MAX_DOTS / 2), 0), total - MAX_DOTS) : 0;
  const last = Math.min(total, first + MAX_DOTS);
  const items = [];
  for (let i = first; i < last; i++) {
    const on = i === current;
    const color = on ? c.text : c.textMuted;
    const opacity = on ? 1 : 0.5;
    items.push(
      i === 0 && location ? (
        <Svg key={i} width={10} height={10} viewBox="0 0 12 12" style={{ opacity }}>
          <Path d="M11 1L1 5.2l4.2 1.6L6.8 11z" fill={color} />
        </Svg>
      ) : (
        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity }} />
      ),
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}
    >
      {items}
    </View>
  );
}
