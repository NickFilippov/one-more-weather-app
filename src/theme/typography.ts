import type { TextStyle } from 'react-native';
import { font } from './fonts';

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** Стили без цвета: цвет добавляет компонент. Системный шрифт без fontFamily. */
export const type = {
  // Строка 0.9× из дизайна (108) в iOS обрезает и сдвигает глиф: высота строки естественная,
  // а лишний воздух снимает отрицательный отступ в TempHero.
  // includeFontPadding: false — Android иначе добавляет над и под цифрами лишний воздух (на iOS игнорируется)
  tempHero: { fontFamily: font.thin, fontSize: 120, letterSpacing: -4.8, fontVariant: tabular, includeFontPadding: false },
  tempLg: { fontFamily: font.light, fontSize: 48, lineHeight: 48, letterSpacing: -0.96, fontVariant: tabular },
  tileValue: { fontFamily: font.light, fontSize: 44, lineHeight: 48, letterSpacing: -0.88, fontVariant: tabular },
  place: { fontFamily: font.medium, fontSize: 34, lineHeight: 40, letterSpacing: -0.34 },
  cityName: { fontFamily: font.medium, fontSize: 22, lineHeight: 28 },
  headline: { fontSize: 20, lineHeight: 25, fontWeight: '500' },
  rangeHero: { fontSize: 17, lineHeight: 22, fontWeight: '500', fontVariant: tabular },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  numeral: { fontSize: 17, lineHeight: 22, fontWeight: '500', fontVariant: tabular },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  dayName: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.72, textTransform: 'uppercase' },
  micro: { fontSize: 13, lineHeight: 16, fontWeight: '600', fontVariant: tabular },
  popDay: { fontSize: 11, lineHeight: 12, fontWeight: '600', fontVariant: tabular },
  field: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  unit: { fontSize: 17, lineHeight: 22, fontWeight: '500' },
  cardBottom: { fontSize: 15, lineHeight: 20, fontWeight: '500', fontVariant: tabular },
} as const satisfies Record<string, TextStyle>;
