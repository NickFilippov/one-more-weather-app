import { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import type { BlurTargetRef } from '@/components/atmosphere/BlurTargetContext';
import { useFooterBottom } from '@/components/Footer';
import { DailyForecast } from '@/components/DailyForecast';
import { HourlyForecast } from '@/components/HourlyForecast';
import { StatePanel } from '@/components/StatePanel';
import { TempHero } from '@/components/TempHero';
import { Tiles } from '@/components/Tiles';
import type { City } from '@/features/cities/types';
import { ru } from '@/i18n/ru';
import { formatClock } from '@/lib/format';
import { cityClock } from '@/lib/time';
import { useMinuteTick } from '@/lib/useMinuteTick';
import { useReduceMotion } from '@/lib/useReduceMotion';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { buildMainVM } from './model/viewModels';
import { useWeatherStore } from './weatherStore';

const SOURCE_URL = 'https://open-meteo.com/';

/** Один город на главном экране: небо, шапка, лента часов, 10 дней, плитки. */
export function CityPage({
  city,
  active,
  onBlurTarget,
}: {
  city: City;
  active: boolean;
  onBlurTarget?: (ref: BlurTargetRef) => void;
}) {
  const forecast = useWeatherStore((s) => s.entries[city.id]);
  const status = useWeatherStore((s) => s.status[city.id]);
  const error = useWeatherStore((s) => s.error[city.id]);
  const refresh = useWeatherStore((s) => s.refresh);
  const minute = useMinuteTick(active);
  const [pulling, setPulling] = useState(false);

  // «Сейчас» с точностью до минуты: от него зависят ближайшие восход и закат в плитках
  const vm = useMemo(() => (forecast ? buildMainVM(city, forecast, minute * 60) : null), [forecast, city, minute]);

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
      <Atmosphere condition={sky} active={active} onBlurTarget={onBlurTarget}>
        {vm && forecast ? (
          <Content vm={vm} fetchedAt={forecast.fetchedAt} offset={forecast.utcOffsetSeconds} stale={status === 'error'} active={active} pulling={pulling} onPull={onPull} />
        ) : (
          <Empty status={status} error={error} onRetry={retry} />
        )}
      </Atmosphere>
    </ThemeProvider>
  );
}

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

  return (
    <ScrollView
      contentContainerStyle={[pad, styles.content]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
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
  stale: { textAlign: 'center' },
  source: { textAlign: 'center', paddingVertical: 8 },
});
