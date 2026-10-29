import { StyleSheet, Text, View } from 'react-native';
import { Atmosphere } from '@/components/atmosphere/Atmosphere';
import { PressableScale } from '@/components/glass/PressableScale';
import { Reveal } from '@/components/Reveal';
import type { CityCardVM } from '@/features/weather/types';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props extends CityCardVM {
  onPress: () => void;
  delay?: number;
}

/** Карточка в списке городов: внутри небо и тема своего города (BR-01). Небо не анимируется (NFR-05). */
export function CityCard({ onPress, delay = 0, ...vm }: Props) {
  return (
    <Reveal delay={delay} style={styles.wrap}>
      <ThemeProvider theme={vm.theme}>
        <Card vm={vm} onPress={onPress} />
      </ThemeProvider>
    </Reveal>
  );
}

function Card({ vm, onPress }: { vm: CityCardVM; onPress: () => void }) {
  const { c, shadow } = useTheme();
  return (
    <PressableScale scale to={0.98} label={vm.a11y} onPress={onPress}>
      {(pressed) => (
        <View style={[styles.card, { boxShadow: shadow.lift }]}>
          <View style={styles.clip}>
            <Atmosphere condition={vm.sky} active={false}>
              <View style={styles.body}>
                <View style={styles.row}>
                  <View style={styles.title}>
                    <Text style={[type.cityName, { color: c.text }]} numberOfLines={1}>
                      {vm.name}
                    </Text>
                    {vm.sub ? (
                      <Text style={[type.micro, { color: c.textMuted }]} numberOfLines={1}>
                        {vm.sub}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[type.tempLg, { color: c.text }]}>{vm.temp}</Text>
                </View>
                <View style={[styles.row, styles.bottom]}>
                  <Text style={[type.cardBottom, styles.label, { color: c.text }]} numberOfLines={1}>
                    {vm.label}
                  </Text>
                  <Text style={[type.cardBottom, { color: c.text }]} numberOfLines={1}>
                    {vm.range}
                  </Text>
                </View>
              </View>
            </Atmosphere>
            {pressed ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.glassFillStrong }]} />
            ) : null}
          </View>
          {/* рамка поверх неба, внутрь карточки */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.edge, { borderColor: c.hairline }]} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 116 },
  card: { flex: 1, borderRadius: radius.card },
  clip: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  edge: { borderRadius: radius.card, borderWidth: 1 },
  body: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1 },
  bottom: { alignItems: 'baseline' },
  label: { flexShrink: 1 },
});
