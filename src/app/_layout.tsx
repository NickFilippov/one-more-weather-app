import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SplashOverlay } from '@/features/splash/SplashOverlay';
import { useWeatherAutoRefresh } from '@/features/weather/useWeatherAutoRefresh';
import { setEntrancePhase } from '@/lib/entrance';
import { ReduceMotionProvider } from '@/lib/useReduceMotion';
import { fontAssets } from '@/theme/fontAssets';
import { GlassModeProvider } from '@/theme/ThemeProvider';
import { colors } from '@/theme/tokens';

// Нативный сплэш держится, пока не нарисован слой SplashOverlay с тем же кадром. Слой прячет его
// и сразу начинает восход. Главный экран монтируется, когда кадр сплэша собран и неподвижен,
// и ждёт своей фазы появления.
void SplashScreen.preventAutoHideAsync();
setEntrancePhase('cover');

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const fontsReady = loaded || !!error;
  // Тяжёлый монтаж главного экрана (на Android около секунды) не должен рвать анимацию сплэша
  const [mainMounted, setMainMounted] = useState(false);
  const [mainReady, setMainReady] = useState(false);
  const mountMain = useCallback(() => setMainMounted(true), []);
  // Раскладка готова; ещё два кадра, чтобы нативные виды успели нарисоваться
  const onMainLayout = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setMainReady(true)));
  }, []);
  useWeatherAutoRefresh();

  return (
    <ReduceMotionProvider>
      <GlassModeProvider>
        <StatusBar style="light" />
        {fontsReady && mainMounted && (
          <View style={{ flex: 1 }} onLayout={onMainLayout}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night.skyBottom } }} />
          </View>
        )}
        <SplashOverlay fontsReady={fontsReady} mainReady={mainReady} onMountMain={mountMain} />
      </GlassModeProvider>
    </ReduceMotionProvider>
  );
}
