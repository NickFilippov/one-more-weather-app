import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import { BlurTargetContext, type BlurTargetRef } from '@/components/atmosphere/BlurTargetContext';
import { Footer } from '@/components/Footer';
import PagerView from 'react-native-pager-view';
import { PageDots } from '@/components/PageDots';
import { StatePanel } from '@/components/StatePanel';
import { useCitiesStore } from '@/features/cities/citiesStore';
import { useUiStore } from '@/features/cities/uiStore';
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

  const pagerRef = useRef<PagerView>(null);
  const appActive = useAppActive();
  const [currentId, setCurrentId] = useState<string | null>(null);
  // Небо активной страницы: цель размытия для футера, который лежит поверх пейджера
  const [footerTarget, setFooterTarget] = useState<BlurTargetRef | null>(null);

  // Текущая страница хранится по id, а не по индексу: добавление города не должно её сдвигать.
  const index = Math.max(0, pages.findIndex((c) => c.id === currentId));
  const city = pages[index];

  const forecast = useWeatherStore((s) => (city ? s.entries[city.id] : undefined));
  const footerTheme = forecast ? themeOf(forecast) : 'night';

  // Экран городов просит открыть конкретный город: подписка, а не эффект на состояние.
  useEffect(
    () =>
      useUiStore.subscribe((ui) => {
        const id = ui.activeCityId;
        if (!id) return;
        const i = pages.findIndex((c) => c.id === id);
        if (i >= 0) {
          pagerRef.current?.setPage(i);
          setCurrentId(id);
        }
        ui.setActiveCityId(null);
      }),
    [pages],
  );

  const openCities = useCallback(() => router.push('/cities'), []);

  if (pages.length === 0) {
    return (
      <ThemeProvider theme="night">
        <Atmosphere condition="clouds" active={appActive}>
          <View style={styles.empty}>
            <StatePanel
              title={ru.state.emptyTitle}
              text={ru.state.emptyText}
              actions={[{ label: ru.state.pickCity, onPress: openCities }]}
            />
          </View>
        </Atmosphere>
      </ThemeProvider>
    );
  }

  return (
    <View style={styles.root}>
      {/* города листаются свайпом */}
      <PagerView
        ref={pagerRef}
        style={styles.root}
        initialPage={index}
        onPageSelected={(e) => setCurrentId(pages[e.nativeEvent.position]?.id ?? null)}
      >
        {pages.map((c, i) => (
          <View key={c.id} style={styles.root} collapsable={false}>
            <CityPage city={c} active={appActive && i === index} onBlurTarget={setFooterTarget} />
          </View>
        ))}
      </PagerView>
      <ThemeProvider theme={footerTheme}>
        <BlurTargetContext.Provider value={footerTarget}>
          <Footer
            onOpenCities={openCities}
            dots={
              <PageDots
                count={pages.length}
                current={index}
                location={!!currentLocation}
                label={ru.a11y.pageDots(city.name, index + 1, pages.length)}
              />
            }
          />
        </BlurTargetContext.Provider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 16 },
});
