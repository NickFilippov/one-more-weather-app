import { View } from 'react-native';
import { UiIcon, type UiIconName } from '@/components/icons/UiIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { GlassPanel } from './GlassPanel';

interface Props {
  /** Подпись для VoiceOver и TalkBack: обязательна (NFR-12). */
  label: string;
  icon: UiIconName;
  /** 56 в футере, 44 в шапке. */
  size?: 56 | 44;
  onPress?: () => void;
  delay?: number;
}

export function GlassButton({ label, icon, size = 56, onPress, delay }: Props) {
  const { c } = useTheme();
  return (
    <GlassPanel thick interactive label={label} onPress={onPress} delay={delay} radius={size / 2} style={{ width: size, height: size }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <UiIcon name={icon} size={Math.round(size * 0.43)} color={c.text} />
      </View>
    </GlassPanel>
  );
}
