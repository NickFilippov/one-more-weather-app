import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/glass/GlassPanel';
import { ru } from '@/i18n/ru';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import type { SearchResult } from './geocodingApi';
import type { CitySearch } from './useCitySearch';

interface Props {
  search: CitySearch;
  /** id городов, которые уже в списке: у них подпись «Уже в списке». */
  addedIds: ReadonlySet<string>;
  onPick: (result: SearchResult) => void;
}

/** Результаты поиска под полем. Дизайна нет (S-03, Q-08): одна панель со строками, docs/tech/04. */
export function SearchResults({ search, addedIds, onPick }: Props) {
  const { c } = useTheme();
  const { status, results } = search;

  if (results.length === 0) {
    const busy = status === 'loading';
    const text = busy ? ru.cities.searching : status === 'error' ? ru.cities.searchError : ru.cities.nothingFound;
    return (
      <GlassPanel group label={text}>
        <View style={styles.message} accessibilityLiveRegion="polite">
          {busy ? <ActivityIndicator color={c.text} /> : null}
          <Text style={[type.body, styles.messageText, { color: c.text }]}>{text}</Text>
        </View>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      {results.map((r, i) => {
        const added = addedIds.has(r.city.id);
        const a11y = [r.city.name, r.sub, added ? ru.cities.alreadyAdded : ''].filter(Boolean).join(', ');
        return (
          <Pressable
            key={r.city.id}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            onPress={() => onPick(r)}
            style={({ pressed }) => [
              styles.row,
              i > 0 && { borderTopWidth: 1, borderTopColor: c.hairline },
              pressed && { backgroundColor: c.glassFillStrong },
            ]}
          >
            <View style={styles.title}>
              <Text style={[type.label, { color: c.text }]} numberOfLines={1}>
                {r.city.name}
              </Text>
              {r.sub ? (
                <Text style={[type.micro, { color: c.textMuted }]} numberOfLines={1}>
                  {r.sub}
                </Text>
              ) : null}
            </View>
            {added ? <Text style={[type.micro, { color: c.textMuted }]}>{ru.cities.alreadyAdded}</Text> : null}
          </Pressable>
        );
      })}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  message: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  messageText: { flex: 1 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  title: { flex: 1, gap: 2 },
});
