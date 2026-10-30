import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Panel } from '@/components/Panel';
import { Reveal } from '@/components/Reveal';
import { RoundButton } from '@/components/RoundButton';
import { ru } from '@/i18n/ru';
import { useTheme } from '@/theme/ThemeProvider';
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
  const { c } = useTheme();
  const bottom = useFooterBottom();
  return (
    <Reveal pointerEvents="box-none" style={[styles.root, { bottom }]}>
      {onOpenMap ? <RoundButton label={ru.a11y.map} icon="map" onPress={onOpenMap} /> : <View style={styles.spacer} />}
      <Panel radius={radius.pill} style={[styles.pill, { backgroundColor: c.panelSolid }]}>
        {dots}
      </Panel>
      <RoundButton label={ru.a11y.cityList} icon="list" onPress={onOpenCities} />
    </Reveal>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: 56, height: 56 },
  pill: { height: 56, paddingHorizontal: 24 },
});
