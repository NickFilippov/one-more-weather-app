import { StyleSheet, TextInput, View } from 'react-native';
import { UiIcon } from '@/components/icons/UiIcon';
import { Panel } from '@/components/Panel';
import { ru } from '@/i18n/ru';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

/** Поле поиска городов в панели-пилюле. */
export function SearchField({ value, onChangeText }: Props) {
  const { c } = useTheme();
  return (
    <Panel radius={radius.pill} style={styles.panel}>
      <View style={styles.row}>
        <UiIcon name="search" size={20} color={c.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={ru.cities.searchPlaceholder}
          placeholderTextColor={c.textMuted}
          accessibilityLabel={ru.a11y.search}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
          clearButtonMode="while-editing"
          keyboardAppearance="dark"
          selectionColor={c.text}
          cursorColor={c.text}
          underlineColorAndroid="transparent"
          // без lineHeight: в однострочном поле iOS он сдвигает текст вниз
          style={[styles.input, { fontSize: type.field.fontSize, fontWeight: type.field.fontWeight, color: c.text }]}
        />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { height: 52 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  input: { flex: 1, alignSelf: 'stretch', paddingVertical: 0 },
});
