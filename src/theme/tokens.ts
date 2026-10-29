export const colors = {
  day: {
    skyTop: '#2a62a3',
    skyMid: '#1d4880',
    skyBottom: '#163c6e',
    glassFill: 'rgba(255,255,255,0.12)',
    glassFillStrong: 'rgba(255,255,255,0.20)',
    glassEdge: 'rgba(255,255,255,0.42)',
    glassEdgeSoft: 'rgba(255,255,255,0.10)',
    glassSpecular: 'rgba(255,255,255,0.22)',
    glassFrosted: 'rgba(10,35,80,0.32)',
    glassEdgeFrosted: 'rgba(255,255,255,0.18)',
    hairline: 'rgba(255,255,255,0.16)',
    text: '#ffffff',
    textMuted: '#dfe9f7',
    sun: '#ffd36b',
    onSun: '#2a1d00',
    rain: '#8fd3ff',
    rainText: '#b0e0ff',
    cold: '#7cc4ff',
    warm: '#ffb057',
    alert: '#ffa36b',
    focus: '#ffffff',
  },
  night: {
    skyTop: '#152452',
    skyMid: '#0f1a3e',
    skyBottom: '#070d24',
    glassFill: 'rgba(255,255,255,0.10)',
    glassFillStrong: 'rgba(255,255,255,0.16)',
    glassEdge: 'rgba(255,255,255,0.30)',
    glassEdgeSoft: 'rgba(255,255,255,0.07)',
    glassSpecular: 'rgba(255,255,255,0.14)',
    glassFrosted: 'rgba(4,9,24,0.40)',
    glassEdgeFrosted: 'rgba(255,255,255,0.12)',
    hairline: 'rgba(255,255,255,0.12)',
    text: '#ffffff',
    textMuted: '#c3cde3',
    sun: '#ffd36b',
    onSun: '#2a1d00',
    rain: '#8fd3ff',
    rainText: '#8fd3ff',
    cold: '#7cc4ff',
    warm: '#ffb057',
    alert: '#ffa36b',
    focus: '#ffffff',
  },
} as const;

export type Palette = { -readonly [K in keyof typeof colors.day]: string };

export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 40 } as const;
export const radius = { chip: 14, card: 26, sheet: 42, pill: 999 } as const;

export const shadow = {
  day: {
    lift: '0 16px 40px rgba(6,22,52,0.30)',
    liftInset: 'inset 0 1px 0 rgba(255,255,255,0.35)',
    press: '0 6px 16px rgba(6,22,52,0.26)',
    pressInset: 'inset 0 1px 0 rgba(255,255,255,0.45)',
  },
  night: {
    lift: '0 16px 40px rgba(0,0,10,0.50)',
    liftInset: 'inset 0 1px 0 rgba(255,255,255,0.22)',
    press: '0 6px 16px rgba(0,0,10,0.45)',
    pressInset: 'inset 0 1px 0 rgba(255,255,255,0.30)',
  },
} as const;
export type Shadow = (typeof shadow)['day'] | (typeof shadow)['night'];

export const duration = { tap: 120, ui: 280, reveal: 640, count: 900, stagger: 45 } as const;
