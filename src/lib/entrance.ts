import { useState } from 'react';
import { create } from 'zustand';

/**
 * Ворота появления. Под сплэшем главный экран уже смонтирован, но его анимации появления ждут:
 * cover — экран закрыт сплэшем, reveal — небо раскрывается и появление идёт, done — сплэша нет.
 */
export type EntrancePhase = 'cover' | 'reveal' | 'done';

/** Сдвиг появления под сплэшем: сначала прилетает температура, потом всё остальное. */
export const ENTRANCE_SHIFT = 760;

interface EntranceState {
  phase: EntrancePhase;
  /** Точка восхода по вертикали в координатах окна: из неё вылетает температура. */
  originY: number | null;
}

const useEntranceStore = create<EntranceState>()(() => ({ phase: 'done', originY: null }));

export const setEntrancePhase = (phase: EntrancePhase) => useEntranceStore.setState({ phase });
export const setEntranceOrigin = (originY: number) => useEntranceStore.setState({ originY });
export const useEntrancePhase = () => useEntranceStore((s) => s.phase);
export const useEntranceOrigin = () => useEntranceStore((s) => s.originY);

export interface Entrance {
  /** Появление можно начинать. */
  ready: boolean;
  /** Компонент смонтирован под сплэшем: появляется по его сценарию. */
  underSplash: boolean;
  /** Добавка к задержке появления, мс. */
  shift: number;
}

export function useEntrance(): Entrance {
  // Решается один раз при монтировании: иначе по окончании сплэша задержки поменяются
  // и появление начнётся заново.
  const [underSplash] = useState(() => useEntranceStore.getState().phase !== 'done');
  const ready = useEntranceStore((s) => !underSplash || s.phase !== 'cover');
  return { ready, underSplash, shift: underSplash ? ENTRANCE_SHIFT : 0 };
}
