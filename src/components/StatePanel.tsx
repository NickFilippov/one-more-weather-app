import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/glass/GlassPanel';
import { PressableScale } from '@/components/glass/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  title?: string;
  text: string;
  actions?: { label: string; onPress: () => void }[];
  busy?: boolean;
}

/** Состояния без собственного дизайна: загрузка, ошибка, пустой список (docs/tech/03). */
export function StatePanel({ title, text, actions, busy }: Props) {
  const { c } = useTheme();
  return (
    <GlassPanel group label={title ? `${title}. ${text}` : text}>
      <View style={styles.inner}>
        {title ? <Text style={[type.headline, { color: c.text }]}>{title}</Text> : null}
        <Text style={[type.body, { color: c.text }]}>{text}</Text>
        {busy ? <ActivityIndicator color={c.text} style={{ alignSelf: 'flex-start' }} /> : null}
        {actions?.map((a) => (
          // кнопка без собственного стекла: стекло на стекло не кладём; размер задаёт обёртка
          <View key={a.label} style={styles.button}>
            <PressableScale scale label={a.label} onPress={a.onPress}>
              {(pressed) => (
                <View
                  style={[
                    styles.buttonInner,
                    { backgroundColor: pressed ? c.glassEdge : c.glassFillStrong, borderRadius: radius.pill },
                  ]}
                >
                  <Text style={[type.label, { color: c.text }]}>{a.label}</Text>
                </View>
              )}
            </PressableScale>
          </View>
        ))}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  inner: { padding: 16, gap: 12 },
  button: { height: 44 },
  buttonInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
