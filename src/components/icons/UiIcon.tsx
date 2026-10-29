import Svg, { Circle, Path } from 'react-native-svg';

export type UiIconName = 'map' | 'list' | 'back' | 'more' | 'search';

interface Props {
  name: UiIconName;
  size?: number;
  color: string;
}

/** Значки интерфейса из макетов: viewBox 24×24, одинаковые на обеих платформах. */
export function UiIcon({ name, size = 24, color }: Props) {
  const common = { width: size, height: size, viewBox: '0 0 24 24' } as const;
  switch (name) {
    case 'map':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 6.5l5.5-2.5 7 2.5 5.5-2.5v13.5l-5.5 2.5-7-2.5L3 20z" />
          <Path d="M8.5 4v13.5M15.5 6.5V20" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
          <Path d="M9 6h11M9 12h11M9 18h11" />
          <Circle cx={4.5} cy={6} r={1.2} fill={color} stroke="none" />
          <Circle cx={4.5} cy={12} r={1.2} fill={color} stroke="none" />
          <Circle cx={4.5} cy={18} r={1.2} fill={color} stroke="none" />
        </Svg>
      );
    case 'back':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 5l-7 7 7 7" />
        </Svg>
      );
    case 'more':
      return (
        <Svg {...common} fill={color}>
          <Circle cx={5} cy={12} r={1.9} />
          <Circle cx={12} cy={12} r={1.9} />
          <Circle cx={19} cy={12} r={1.9} />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
          <Circle cx={11} cy={11} r={6.5} />
          <Path d="M16 16l4.5 4.5" />
        </Svg>
      );
  }
}
