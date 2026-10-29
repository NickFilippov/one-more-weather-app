import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Заголовок панели. Текст обычным регистром, прописные даёт стиль caption. */
export function PanelHeader({ children }: { children: string }) {
  const { c } = useTheme();
  return (
    <Text accessibilityRole="header" style={[type.caption, { color: c.textMuted, paddingTop: 12, paddingHorizontal: 16 }]}>
      {children}
    </Text>
  );
}
