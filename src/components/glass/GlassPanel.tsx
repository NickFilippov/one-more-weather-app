import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useBlurTarget } from '@/components/atmosphere/BlurTargetContext';
import { useTheme } from '@/theme/ThemeProvider';
import { duration, radius as radii } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import { useReveal } from './useReveal';

interface Props {
  /** Толстое стекло: футер, поле поиска, кнопки. */
  thick?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  /** Задержка появления, мс. */
  delay?: number;
  reveal?: boolean;
  /** accessibilityLabel кнопки; у неинтерактивной панели действует только с `group`. */
  label?: string;
  /** Панель читается экранным диктором как один элемент. */
  group?: boolean;
  radius?: number;
  style?: ViewStyle;
  children?: ReactNode;
}

// Стартовые значения, подбираются на устройстве (docs/tech/04-ui-spec.md, «Результаты спайка»)
const BLUR_INTENSITY = { regular: 35, thick: 60 };

/**
 * Стеклянная поверхность. Liquid Glass (iOS 26+) рисует система через GlassView,
 * иначе матовое стекло: размытие, заливка glass-frosted и кромка 1 pt.
 * Появление: у Liquid Glass не меняем opacity (Apple не советует), стекло включается
 * переходом style none → regular, а содержимое проявляется отдельно.
 */
export function GlassPanel({
  thick,
  interactive,
  onPress,
  delay = 0,
  reveal = true,
  label,
  group,
  radius = radii.card,
  style,
  children,
}: Props) {
  const { c, shadow, glass } = useTheme();
  const target = useBlurTarget();
  const liquid = glass === 'liquid';
  const { p, shown, reduce } = useReveal(delay, reveal, liquid);

  const wrap = useAnimatedStyle(() => ({
    opacity: liquid ? 1 : p.value,
    transform: reduce ? [] : [{ translateY: (1 - p.value) * 12 }, { scale: 0.985 + 0.015 * p.value }],
  }));
  const content = useAnimatedStyle(() => ({ opacity: liquid ? p.value : 1 }));

  const body = (pressed: boolean) => {
    if (liquid) {
      return (
        <GlassView
          glassEffectStyle={
            shown ? { style: 'regular', animate: !reduce && reveal, animationDuration: duration.reveal / 1000 } : 'none'
          }
          isInteractive={interactive}
          colorScheme="dark"
          style={{ flexGrow: 1, borderRadius: radius, overflow: 'hidden' }}
        >
          <Animated.View style={[{ flexGrow: 1 }, content]}>{children}</Animated.View>
        </GlassView>
      );
    }
    return (
      <View style={{ flexGrow: 1, borderRadius: radius, boxShadow: pressed ? shadow.press : shadow.lift }}>
        <View style={{ flexGrow: 1, borderRadius: radius, overflow: 'hidden' }}>
          {/* iOS и веб размывают всё, что лежит под панелью; Android — только содержимое цели */}
          {(Platform.OS !== 'android' || target) && (
            <BlurView
              blurTarget={target ?? undefined}
              blurMethod="dimezisBlurViewSdk31Plus"
              intensity={thick ? BLUR_INTENSITY.thick : BLUR_INTENSITY.regular}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: pressed ? c.glassFillStrong : c.glassFill }]} />
          {children}
        </View>
        {/* кромка и верхний блик поверх содержимого, без сдвига раскладки */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: c.glassEdge,
              boxShadow: pressed ? shadow.pressInset : shadow.liftInset,
            },
          ]}
        />
      </View>
    );
  };

  return (
    <Animated.View style={[style, wrap]}>
      {interactive ? (
        <PressableScale scale={!liquid} onPress={onPress} label={label}>
          {body}
        </PressableScale>
      ) : (
        <View style={{ flexGrow: 1 }} accessible={group} accessibilityLabel={group ? label : undefined}>
          {body(false)}
        </View>
      )}
    </Animated.View>
  );
}
