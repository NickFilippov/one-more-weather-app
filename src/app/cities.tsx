import { useCallback, useMemo, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityCard } from '@/components/CityCard';
import { PillButton } from '@/components/PillButton';
import { RoundButton } from '@/components/RoundButton';
import { SearchField } from '@/components/SearchField';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { selectPages, useCitiesStore } from '@/features/cities/citiesStore';
import type { SearchResult } from '@/features/cities/geocodingApi';
import { SearchResults } from '@/features/cities/SearchResults';
import { requestAndLocate, useLocateStatus } from '@/features/cities/useCurrentLocation';
import { useCitySearch } from '@/features/cities/useCitySearch';
import { buildCityCardVM } from '@/features/weather/model/viewModels';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { ru } from '@/i18n/ru';
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
  const removeCity = useCitiesStore((s) => s.removeCity);
  const forget = useWeatherStore((s) => s.forget);
  const permission = useCitiesStore((s) => s.locationPermission);
  const locateStatus = useLocateStatus((s) => s.status);
  const entries = useWeatherStore((s) => s.entries);
  const status = useWeatherStore((s) => s.status);
  const refresh = useWeatherStore((s) => s.refresh);
  // Местное время в подписях карточек — на момент открытия экрана
  const [openedAt] = useState(Date.now);
  const [text, setText] = useState('');
  const [editRequested, setEditRequested] = useState(false);
  const search = useCitySearch(text);

  const pages = useMemo(() => selectPages({ currentLocation, saved }), [currentLocation, saved]);
  const addedIds = useMemo(() => new Set(pages.map((city) => city.id)), [pages]);
  // Правка закрывается сама, когда удалять больше нечего
  const editing = editRequested && saved.length > 0;
  const cards = useMemo(
    () => pages.map((city) => buildCityCardVM(city, entries[city.id], Math.floor(openedAt / 1000), status[city.id] === 'error')),
    [pages, entries, status, openedAt],
  );

  // Назад на главный экран с параметром city: он сам листает к этому городу
  const open = useCallback((id: string) => router.dismissTo({ pathname: '/', params: { city: id } }), []);

  const remove = useCallback(
    (id: string) => {
      removeCity(id);
      forget(id);
    },
    [removeCity, forget],
  );

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
          <RoundButton size={44} label={ru.a11y.back} icon="back" onPress={() => router.back()} />
          {saved.length > 0 ? (
            <RoundButton
              size={44}
              label={editing ? ru.a11y.doneEditing : ru.a11y.editList}
              icon={editing ? 'done' : 'more'}
              onPress={() => setEditRequested(!editing)}
            />
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <Text accessibilityRole="header" style={[type.place, { color: c.text }]}>
          {ru.cities.title}
        </Text>
        <SearchField value={text} onChangeText={setText} />
        {search.status === 'idle' ? (
          <>
            {!currentLocation && permission !== 'denied' ? (
              <>
                <PillButton
                  label={locateStatus === 'locating' ? ru.state.locating : ru.state.locate}
                  onPress={requestAndLocate}
                  busy={locateStatus === 'locating'}
                />
                {locateStatus === 'error' ? (
                  <Text style={[type.body, { color: c.text }]}>{ru.state.locateError}</Text>
                ) : null}
              </>
            ) : null}
            {cards.map((vm, i) => (
              <View key={vm.id} style={styles.cardRow}>
                <CityCard {...vm} delay={80 + i * duration.stagger} onPress={() => open(vm.id)} />
                {/* местоположение не удаляется: его убирает только отзыв доступа */}
                {editing && vm.id !== currentLocation?.id ? (
                  <RoundButton size={44} label={ru.a11y.deleteCity(vm.name)} icon="delete" onPress={() => remove(vm.id)} />
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <SearchResults search={search} addedIds={addedIds} onPick={pick} />
        )}
      </ScrollView>
      <StatusBarScrim />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerSpacer: { width: 44, height: 44 },
});
