import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import { Footer } from '@/components/Footer';
import PagerView from 'react-native-pager-view';
import { PageDots } from '@/components/PageDots';
import { StatePanel } from '@/components/StatePanel';
import { useCitiesStore } from '@/features/cities/citiesStore';
import { requestAndLocate, useLocateStatus } from '@/features/cities/useCurrentLocation';
import { CityPage } from '@/features/weather/CityPage';
import { themeOf } from '@/features/weather/model/viewModels';
import { useWeatherStore } from '@/features/weather/weatherStore';
import { ru } from '@/i18n/ru';
import { useAppActive } from '@/lib/useAppActive';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function MainScreen() {
  const currentLocation = useCitiesStore((s) => s.currentLocation);
  const saved = useCitiesStore((s) => s.saved);
  const pages = useMemo(() => (currentLocation ? [currentLocation, ...saved] : saved), [currentLocation, saved]);
  const permission = useCitiesStore((s) => s.locationPermission);
  const locateStatus = useLocateStatus((s) => s.status);

  const pagerRef = useRef<PagerView>(null);
  // Пока пользователь сам не листал, первая страница остаётся первой: местоположение, определившееся
  // позже сохранённых городов, встаёт на экран. После первого листания текущий город запоминается.
  const navigated = useRef(false);
  const appActive = useAppActive();
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Текущая страница хранится по id, а не по индексу: добавление города не должно её сдвигать.
  const index = Math.max(0, pages.findIndex((c) => c.id === currentId));
  const city = pages[index];
  // Какая страница «активна» (анимации неба и иконок, счёт температуры), решается с отставанием:
  // точка и футер меняются сразу, а тяжёлая перерисовка двух страниц идёт следом и не задерживает их.
  const deferredId = useDeferredValue(currentId);
  const activeIndex = Math.max(0, pages.findIndex((c) => c.id === deferredId));

  const forecast = useWeatherStore((s) => (city ? s.entries[city.id] : undefined));
  const footerTheme = forecast ? themeOf(forecast) : 'night';

  // Экран городов возвращается сюда с параметром city: листаем к этому городу (currentId обновит
  // onPageSelected) и сбрасываем параметр, чтобы повторный выбор того же города тоже сработал.
  const { city: requested } = useLocalSearchParams<{ city?: string }>();
  useEffect(() => {
    if (!requested) return;
    const i = pages.findIndex((c) => c.id === requested);
    if (i >= 0) {
      navigated.current = true;
      pagerRef.current?.setPage(i);
    }
    router.setParams({ city: undefined });
  }, [requested, pages]);

  const openCities = useCallback(() => router.push('/cities'), []);

  if (pages.length === 0) {
    const locating = locateStatus === 'locating';
    return (
      <ThemeProvider theme="night">
        <Atmosphere condition="clouds" active={appActive}>
          <View style={styles.empty}>
            {permission === 'denied' ? (
              <StatePanel
                title={ru.state.noCitiesTitle}
                text={ru.state.noCitiesText}
                actions={[{ label: ru.state.pickCity, onPress: openCities }]}
              />
            ) : (
              <StatePanel
                title={ru.state.emptyTitle}
                text={locateStatus === 'error' ? ru.state.locateError : ru.state.emptyText}
                actions={[
                  { label: locating ? ru.state.locating : ru.state.locate, onPress: requestAndLocate, busy: locating },
                  { label: ru.state.pickCity, onPress: openCities },
                ]}
              />
            )}
          </View>
        </Atmosphere>
      </ThemeProvider>
    );
  }

  return (
    <View style={styles.root}>
      {/* Города листаются свайпом. Местоположение встаёт первым или уходит, город добавляют или
          удаляют, и страницы сдвигаются, а pager остался бы на прежней позиции: на это редкое событие
          он пересоздаётся на текущем городе (или на первом, если текущий удалён). */}
      <PagerView
        key={`${currentLocation ? 'with-location' : 'saved-only'}-${pages.length}`}
        ref={pagerRef}
        style={styles.root}
        initialPage={index}
        onPageScrollStateChanged={(e) => {
          if (e.nativeEvent.pageScrollState === 'dragging') navigated.current = true;
        }}
        onPageSelected={(e) => {
          if (navigated.current) setCurrentId(pages[e.nativeEvent.position]?.id ?? null);
        }}
      >
        {pages.map((c, i) => (
          <View key={c.id} style={styles.root} collapsable={false}>
            <CityPage city={c} active={appActive && i === activeIndex} />
          </View>
        ))}
      </PagerView>
      <ThemeProvider theme={footerTheme}>
        <Footer
          onOpenCities={openCities}
          dots={
            <PageDots
              count={pages.length}
              current={index}
              location={!!currentLocation}
              label={ru.a11y.pageDots(city.name, index + 1, pages.length)}
              onSelect={(i) => {
                navigated.current = true;
                pagerRef.current?.setPage(i);
                // точка и футер меняются сразу, а не после конца анимации пейджера (onPageSelected)
                setCurrentId(pages[i]?.id ?? null);
              }}
            />
          }
        />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
});
