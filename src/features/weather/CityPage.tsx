import { memo, useCallback, useMemo, useState } from 'react';
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import { useFooterBottom } from '@/components/Footer';
import { DailyForecast } from '@/components/DailyForecast';
import { HourlyForecast } from '@/components/HourlyForecast';
import { StatePanel } from '@/components/StatePanel';
import { StatusBarScrim } from '@/components/StatusBarScrim';
import { TempHero } from '@/components/TempHero';
import { Tiles } from '@/components/Tiles';
import type { City } from '@/features/cities/types';
import { ru } from '@/i18n/ru';
import { formatClock } from '@/lib/format';
import { cityClock } from '@/lib/time';
import { useNowMs } from '@/lib/useNowMs';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { buildMainVM } from './model/viewModels';
import { useWeatherStore } from './weatherStore';

const SOURCE_URL = 'https://open-meteo.com/';

/**
 * Один город на главном экране: небо, шапка, лента часов, 10 дней, плитки.
 * `memo`: при смене страницы перерисовываются только две, у которых поменялось `active`;
 * без него каждое листание заново строило все страницы.
 */
export const CityPage = memo(function CityPage({
  city,
  active,
}: {
  city: City;
  active: boolean;
}) {
  const forecast = useWeatherStore((s) => s.entries[city.id]);
  const status = useWeatherStore((s) => s.status[city.id]);
  const error = useWeatherStore((s) => s.error[city.id]);
  const refresh = useWeatherStore((s) => s.refresh);
  const openedAt = useNowMs();
  const [pulling, setPulling] = useState(false);

  // «Сейчас» — момент открытия страницы, возврата в приложение или последнего обновления данных,
  // что позже: прогноз обновляется при запуске и возврате, если он старше 30 минут
  const vm = useMemo(() => {
    if (!forecast) return null;
    return buildMainVM(city, forecast, Math.floor(Math.max(openedAt, forecast.fetchedAt) / 1000));
  }, [forecast, city, openedAt]);

  const retry = useCallback(() => void refresh(city, { force: true }), [refresh, city]);
  const onPull = useCallback(async () => {
    setPulling(true);
    await refresh(city, { force: true });
    setPulling(false);
  }, [refresh, city]);

  const theme = vm?.theme ?? 'night';
  const sky = vm?.sky ?? 'clouds';

  return (
    <ThemeProvider theme={theme}>
      <Atmosphere condition={sky} active={active}>
        {vm && forecast ? (
          <Content vm={vm} fetchedAt={forecast.fetchedAt} offset={forecast.utcOffsetSeconds} stale={status === 'error'} active={active} pulling={pulling} onPull={onPull} />
        ) : (
          <Empty status={status} error={error} onRetry={retry} />
        )}
        <StatusBarScrim />
      </Atmosphere>
    </ThemeProvider>
  );
});

function useContentInsets() {
  const insets = useSafeAreaInsets();
  const footerBottom = useFooterBottom();
  // снизу: футер (56) и запас, чтобы последняя панель уезжала из-под него
  return { paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: footerBottom + 56 + 40 };
}

function Empty({ status, error, onRetry }: { status?: string; error?: { kind: string }; onRetry: () => void }) {
  const pad = useContentInsets();
  const failed = status === 'error';
  return (
    <View style={[styles.empty, pad]}>
      {failed ? (
        <StatePanel
          title={ru.state.errorTitle}
          text={error?.kind === 'offline' ? ru.state.offline : ru.state.serverDown}
          actions={[{ label: ru.state.retry, onPress: onRetry }]}
        />
      ) : (
        <StatePanel text={ru.placeholder.loading} busy />
      )}
    </View>
  );
}

interface ContentProps {
  vm: ReturnType<typeof buildMainVM>;
  fetchedAt: number;
  offset: number;
  stale: boolean;
  active: boolean;
  pulling: boolean;
  onPull: () => void;
}

function Content({ vm, fetchedAt, offset, stale, active, pulling, onPull }: ContentProps) {
  const { c } = useTheme();
  const pad = useContentInsets();
  const reduceMotion = useReduceMotion();
  const animateIcons = active && !reduceMotion;
  const updated = formatClock(cityClock(Math.floor(fetchedAt / 1000), offset));
  // На iOS отступ под статус-бар добавляет система: тогда индикатор обновления встаёт под ним,
  // а не прячется за Dynamic Island. На Android индикатор и так виден, отступ задаём сами.
  const ios = Platform.OS === 'ios';

  return (
    <ScrollView
      contentContainerStyle={[pad, ios && styles.noTop, styles.content]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior={ios ? 'automatic' : 'never'}
      refreshControl={<RefreshControl refreshing={pulling} onRefresh={onPull} tintColor={c.text} colors={[c.text]} progressBackgroundColor={c.skyMid} />}
    >
      {stale ? (
        <Text style={[type.micro, styles.stale, { color: c.text }]} accessibilityLiveRegion="polite">
          {ru.state.staleSince(updated)}
        </Text>
      ) : null}
      <TempHero {...vm.hero} active={active} />
      <HourlyForecast hours={vm.hours} summary={vm.summary} delay={120} animateIcons={animateIcons} />
      <DailyForecast days={vm.days} min={vm.dayMin} max={vm.dayMax} delay={200} animateIcons={animateIcons} />
      <Tiles tiles={vm.tiles} delay={280} />
      <Text
        accessibilityRole="link"
        onPress={() => void Linking.openURL(SOURCE_URL)}
        style={[type.micro, styles.source, { color: c.textMuted }]}
      >
        {ru.attribution}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center' },
  content: { gap: 16 },
  noTop: { paddingTop: 0 },
  stale: { textAlign: 'center' },
  source: { textAlign: 'center', paddingVertical: 8 },
});
