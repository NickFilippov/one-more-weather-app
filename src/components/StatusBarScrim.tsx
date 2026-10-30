import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

/** Плавная подложка под строкой статуса: прокрученный текст не налезает на часы и батарею. */
export function StatusBarScrim() {
  const { c } = useTheme();
  const { top } = useSafeAreaInsets();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[`${c.skyTop}f2`, `${c.skyTop}00`]}
      style={[styles.scrim, { height: top + 14 }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
