import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useWeatherAutoRefresh } from '@/features/weather/useWeatherAutoRefresh';
import { ReduceMotionProvider } from '@/lib/useReduceMotion';
import { fontAssets } from '@/theme/fontAssets';
import { GlassModeProvider } from '@/theme/ThemeProvider';
import { colors } from '@/theme/tokens';

// Сплэш держится, пока не загружены шрифты цифр.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  useWeatherAutoRefresh();

  useEffect(() => {
    if (loaded || error) SplashScreen.hide();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ReduceMotionProvider>
      <GlassModeProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night.skyBottom } }} />
      </GlassModeProvider>
    </ReduceMotionProvider>
  );
}
