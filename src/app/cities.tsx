import { useCallback, useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityCard } from '@/components/CityCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { SearchField } from '@/components/SearchField';
import { selectPages, useCitiesStore } from '@/features/cities/citiesStore';
import type { SearchResult } from '@/features/cities/geocodingApi';
import { SearchResults } from '@/features/cities/SearchResults';
import { useUiStore } from '@/features/cities/uiStore';
import { useCitySearch } from '@/features/cities/useCitySearch';
import { buildCityCardVM } from '@/features/weather/model/viewModels';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { ru } from '@/i18n/ru';
import { useMinuteTick } from '@/lib/useMinuteTick';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { duration } from '@/theme/tokens';
import { type } from '@/theme/typography';

/** Список городов: карточки, поиск и добавление (FR-09…FR-12). Тема экрана ночная, у карточек своя. */
export default function CitiesScreen() {
  return (
    <ThemeProvider theme="night">
      <Body />
    </ThemeProvider>
  );
}

function Body() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const currentLocation = useCitiesStore((s) => s.currentLocation);
  const saved = useCitiesStore((s) => s.saved);
  const addCity = useCitiesStore((s) => s.addCity);
  const entries = useWeatherStore((s) => s.entries);
  const status = useWeatherStore((s) => s.status);
  const refresh = useWeatherStore((s) => s.refresh);
  // Местное время в подписях карточек обновляется раз в минуту, пока экран открыт
  const minute = useMinuteTick(true);
  const [text, setText] = useState('');
  const search = useCitySearch(text);

  const pages = useMemo(() => selectPages({ currentLocation, saved }), [currentLocation, saved]);
  const addedIds = useMemo(() => new Set(pages.map((city) => city.id)), [pages]);
  const cards = useMemo(
    () => pages.map((city) => buildCityCardVM(city, entries[city.id], minute * 60, status[city.id] === 'error')),
    [pages, entries, status, minute],
  );

  // Главный экран подписан на activeCityId и сам листает к городу
  const open = useCallback((id: string) => {
    useUiStore.getState().setActiveCityId(id);
    router.back();
  }, []);

  const pick = useCallback(
    (r: SearchResult) => {
      if (addCity(r.city) === 'duplicate') {
        open(r.city.id);
        return;
      }
      void refresh(r.city, { force: true });
      setText('');
      Keyboard.dismiss();
    },
    [addCity, refresh, open],
  );

  return (
    <LinearGradient colors={[c.skyTop, c.skyBottom]} locations={[0, 0.6]} style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.header}>
          <GlassButton size={44} label={ru.a11y.back} icon="back" onPress={() => router.back()} />
          {/* «Изменить список» (more) появится на этапе 8 вместе с удалением и порядком */}
          <View style={styles.headerSpacer} />
        </View>
        <Text accessibilityRole="header" style={[type.place, { color: c.text }]}>
          {ru.cities.title}
        </Text>
        <SearchField value={text} onChangeText={setText} />
        {search.status === 'idle'
          ? cards.map((vm, i) => (
              <CityCard key={vm.id} {...vm} delay={80 + i * duration.stagger} onPress={() => open(vm.id)} />
            ))
          : <SearchResults search={search} addedIds={addedIds} onPick={pick} />}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  headerSpacer: { width: 44, height: 44 },
});
