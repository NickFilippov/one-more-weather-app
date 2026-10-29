import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius as radii } from '@/theme/tokens';

interface Props {
  radius?: number;
  /** Если задана, панель читается диктором как один элемент с этой подписью. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** Панель на небе: полупрозрачная тёмная заливка и светлая кромка 1 pt. */
export function Panel({ radius = radii.card, label, style, children }: Props) {
  const { c } = useTheme();
  return (
    <View
      accessible={label != null}
      accessibilityLabel={label}
      style={[styles.panel, { borderRadius: radius, backgroundColor: c.panel, borderColor: c.panelEdge }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, overflow: 'hidden' },
});
