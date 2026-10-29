import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { animatedSplash, SplashOverlay } from '@/features/splash/SplashOverlay';
import { useWeatherAutoRefresh } from '@/features/weather/useWeatherAutoRefresh';
import { setEntrancePhase } from '@/lib/entrance';
import { ReduceMotionProvider } from '@/lib/useReduceMotion';
import { fontAssets } from '@/theme/fontAssets';
import { GlassModeProvider } from '@/theme/ThemeProvider';
import { colors } from '@/theme/tokens';

// Нативный сплэш держится, пока не загружены шрифты. Дальше его кадр подхватывает SplashOverlay:
// он сам прячет нативный сплэш, а главный экран под ним ждёт своей фазы появления.
void SplashScreen.preventAutoHideAsync();
if (animatedSplash) setEntrancePhase('cover');

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  useWeatherAutoRefresh();

  useEffect(() => {
    if (!animatedSplash && (loaded || error)) SplashScreen.hide();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ReduceMotionProvider>
      <GlassModeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night.skyBottom } }} />
        <SplashOverlay />
      </GlassModeProvider>
    </ReduceMotionProvider>
  );
}
