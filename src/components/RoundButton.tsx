import { StyleSheet, View } from 'react-native';
import { UiIcon, type UiIconName } from '@/components/icons/UiIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

interface Props {
  /** Подпись для VoiceOver и TalkBack: обязательна (NFR-12). */
  label: string;
  icon: UiIconName;
  /** 56 в футере, 44 в шапке. */
  size?: 56 | 44;
  onPress?: () => void;
}

/** Круглая кнопка с иконкой на непрозрачной заливке. */
export function RoundButton({ label, icon, size = 56, onPress }: Props) {
  const { c } = useTheme();
  return (
    <PressableScale label={label} onPress={onPress} style={{ width: size, height: size, flexGrow: 0 }}>
      {(pressed) => (
        <View
          style={[styles.circle, { borderRadius: size / 2, backgroundColor: c.panelSolid, borderColor: c.panelEdge }]}
        >
          {/* нажатие подсвечивает поверх непрозрачной заливки: сквозь кнопку небо не просвечивает */}
          {pressed ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: c.panelStrong }]} />
          ) : null}
          <UiIcon name={icon} size={Math.round(size * 0.43)} color={c.text} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  circle: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
