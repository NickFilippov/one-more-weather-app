import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/glass/GlassPanel';
import type { TileVM } from '@/features/weather/types';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

interface Props {
  tiles: TileVM[];
  delay?: number;
}

function Tile({ tile, delay }: { tile: TileVM; delay: number }) {
  const { c } = useTheme();
  const spoken = `${tile.label}, ${tile.value}${tile.unit ? ` ${tile.unit}` : ''}. ${tile.note}`;
  return (
    <GlassPanel delay={delay} group label={spoken} style={styles.tile}>
      <View style={styles.inner}>
        <Text style={[type.caption, { color: c.textMuted }]}>{tile.label}</Text>
        <Text style={[type.tileValue, { color: c.text }]} maxFontSizeMultiplier={1.2}>
          {tile.value}
          {tile.unit ? <Text style={[type.unit, { color: c.text }]}> {tile.unit}</Text> : null}
        </Text>
        <Text style={[type.body, styles.note, { color: c.text }]}>{tile.note}</Text>
      </View>
    </GlassPanel>
  );
}

/** Плитки по две в ряду: в ряду одной высоты, пояснения на одной нижней линии. */
export function Tiles({ tiles, delay = 280 }: Props) {
  const rows: TileVM[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  return (
    <View style={{ gap: 16 }}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((t, i) => (
            <Tile key={t.key} tile={t} delay={delay + r * 100 + i * 50} />
          ))}
          {row.length === 1 && <View style={styles.tile} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16 },
  tile: { flex: 1 },
  inner: { flex: 1, minHeight: 168, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  note: { marginTop: 'auto' },
});
