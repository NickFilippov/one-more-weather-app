import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassPanel } from '@/components/glass/GlassPanel';
import { ru } from '@/i18n/ru';
import { radius } from '@/theme/tokens';

/** Расстояние от низа до футера: 28 из макета, но не меньше нижней safe area. */
export function useFooterBottom(): number {
  return Math.max(useSafeAreaInsets().bottom, 28);
}

interface Props {
  /** PageDots внутри пилюли. */
  dots: ReactNode;
  onOpenCities: () => void;
  /** Кнопка карты появится вместе с экраном карты (этап 8); место под неё сохраняется. */
  onOpenMap?: () => void;
}

export function Footer({ dots, onOpenCities, onOpenMap }: Props) {
  const bottom = useFooterBottom();
  return (
    <View pointerEvents="box-none" style={[styles.root, { bottom }]}>
      {onOpenMap ? <GlassButton label={ru.a11y.map} icon="map" onPress={onOpenMap} /> : <View style={styles.spacer} />}
      <GlassPanel thick reveal={false} radius={radius.pill} style={styles.pill}>
        {/* отступ внутри стекла, а не на его обёртке: иначе пилюля сузится */}
        <View style={styles.pillInner}>{dots}</View>
      </GlassPanel>
      <GlassButton label={ru.a11y.cityList} icon="list" onPress={onOpenCities} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: 56, height: 56 },
  pill: { height: 56 },
  pillInner: { flex: 1, paddingHorizontal: 24 },
});
