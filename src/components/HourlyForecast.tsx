import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { WeatherIcon } from '@/components/icons/WeatherIcon';
import type { HourVM } from '@/features/weather/types';
import { formatTemp } from '@/lib/format';
import { ru } from '@/i18n/ru';
import { Panel } from '@/components/Panel';
import { Reveal } from '@/components/Reveal';
import { PanelHeader } from '@/components/PanelHeader';
import { useTheme } from '@/theme/ThemeProvider';
import { duration, radius } from '@/theme/tokens';
import { type } from '@/theme/typography';

interface Props {
  hours: HourVM[];
  summary?: string;
  delay?: number;
  animateIcons: boolean;
}

/** Пять часов ровно заполняют ленту; пункт «Сейчас» выделен. */
export function HourlyForecast({ hours, summary, delay, animateIcons }: Props) {
  const { c } = useTheme();
  const [width, setWidth] = useState(0);
  const itemW = Math.max(64, (width - 16) / 5);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <Reveal delay={delay}>
      <Panel>
        {summary ? (
          <Text
            style={[
              type.body,
              { color: c.text, marginTop: 12, marginHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.hairline },
            ]}
          >
            {summary}
          </Text>
        ) : (
          <PanelHeader>{ru.panels.hourly}</PanelHeader>
        )}
        <View onLayout={onLayout}>
          {width > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={itemW}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 12 }}
            >
              {hours.map((h, i) => (
                <Reveal key={i} delay={i * duration.stagger + 120} style={{ width: itemW }}>
                  <View
                    accessible
                    accessibilityLabel={h.a11y}
                    style={[
                      styles.hour,
                      h.now && {
                        backgroundColor: c.panelStrong,
                        borderWidth: 1,
                        borderColor: c.panelEdge,
                        borderRadius: radius.card - 8,
                      },
                    ]}
                  >
                    <Text style={[type.label, { color: c.text }]}>{h.now ? ru.now : h.time}</Text>
                    <View style={styles.icon}>
                      <WeatherIcon kind={h.icon} size={28} accessible={false} animate={animateIcons} />
                    </View>
                    <Text style={[type.micro, { color: c.rainText, height: 16 }]}>{h.pop ? `${h.pop}%` : ''}</Text>
                    <Text style={[type.numeral, { color: c.text }]}>{formatTemp(h.temp)}</Text>
                  </View>
                </Reveal>
              ))}
            </ScrollView>
          )}
          {/* высота ленты известна заранее, чтобы панель не прыгала до замера ширины */}
          {width === 0 && <View style={{ height: 24 + 8 * 2 + 20 + 4 + 30 + 4 + 16 + 4 + 22 }} />}
        </View>
      </Panel>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  hour: { alignItems: 'center', gap: 4, paddingVertical: 8, borderRadius: radius.chip },
  icon: { height: 30, alignItems: 'center', justifyContent: 'center' },
});
