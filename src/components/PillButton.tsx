import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  label: string;
  onPress: () => void;
  /** Действие идёт: индикатор вместо нажатия. */
  busy?: boolean;
}

/** Кнопка-пилюля состояний (docs/tech/03): «Повторить», «Выбрать город», «Определить местоположение». */
export function PillButton({ label, onPress, busy }: Props) {
  const { c } = useTheme();
  const body = (
    <View style={[styles.inner, { backgroundColor: c.panelStrong, borderRadius: radius.pill }]}>
      {busy ? <ActivityIndicator color={c.text} /> : null}
      <Text style={[type.label, { color: c.text }]}>{label}</Text>
    </View>
  );
  // размер кнопки задаёт обёртка
  return (
    <View style={styles.button}>
      {busy ? (
        <View accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.fill}>
          {body}
        </View>
      ) : (
        <PressableScale label={label} onPress={onPress}>
          {() => body}
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { height: 44 },
  fill: { flex: 1 },
  inner: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
