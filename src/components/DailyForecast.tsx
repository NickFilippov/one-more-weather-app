import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/glass/GlassPanel';
import { WeatherIcon } from '@/components/icons/WeatherIcon';
import { PanelHeader } from '@/components/PanelHeader';
import { Reveal } from '@/components/Reveal';
import { TempBar } from '@/components/TempBar';
import type { DayVM } from '@/features/weather/types';
import { ru } from '@/i18n/ru';
import { formatTemp } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { duration } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  days: DayVM[];
  min: number;
  max: number;
  delay?: number;
  animateIcons: boolean;
}

export function DailyForecast({ days, min, max, delay, animateIcons }: Props) {
  const { c } = useTheme();
  return (
    <GlassPanel delay={delay}>
      <PanelHeader>{ru.panels.daily}</PanelHeader>
      <View style={styles.list}>
        {days.map((d, i) => (
          <Reveal key={i} delay={i * duration.stagger + 200}>
            <View
              accessible
              accessibilityLabel={d.a11y}
              style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.hairline }]}
            >
              <Text style={[type.dayName, styles.name, { color: c.text }]} numberOfLines={1}>
                {d.day}
              </Text>
              <View style={styles.icon}>
                <WeatherIcon kind={d.icon} size={26} accessible={false} animate={animateIcons} />
                {d.pop ? <Text style={[type.popDay, { color: c.rainText }]}>{d.pop}%</Text> : null}
              </View>
              <Text style={[type.numeral, styles.temp, { color: c.textMuted }]}>{formatTemp(d.low)}</Text>
              <TempBar low={d.low} high={d.high} min={min} max={max} now={d.now} index={i} />
              <Text style={[type.numeral, styles.temp, { color: c.text }]}>{formatTemp(d.high)}</Text>
            </View>
          </Reveal>
        ))}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 4, paddingHorizontal: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 8 },
  name: { width: 76 },
  icon: { width: 34, alignItems: 'center' },
  temp: { width: 40, textAlign: 'right' },
});
