import type { EntrancePhase } from '@/lib/entrance';
import { duration } from '@/theme/tokens';

/**
 * Сценарий сплэша «Восход», мс от момента, когда нативная заставка сменилась слоем SplashOverlay.
 * Макет: доски «iPhone · сплэш» и «Android · сплэш»; подробности в docs/tech/04-ui-spec.md.
 */
export const T = {
  /** Солнце поднимается над горизонтом, горизонт расходится, вдоль него разливается свет. */
  rise: 150,
  riseDur: 650,
  /** One, More, Weather, App всплывают по одному. */
  words: [350, 470, 590, 730],
  wordDur: 640,
  accentDur: 780,
  /** Главный экран начинает появляться, пока ещё под сплэшем. */
  gate: 1500,
  /** Тьма отступает от точки восхода к краям. */
  reveal: 1550,
  revealDur: 1000,
  /** Камера поднимает взгляд: горизонт и название уходят вниз, солнце летит в правый верхний угол. */
  out: 1650,
  nameOutDur: 450,
  sceneOutDur: 700,
  /** Слой сплэша снят. */
  end: 2600,
} as const;

/** «Уменьшение движения»: кадр с названием стоит, потом гаснет. */
export const STILL = { hold: 900, fade: duration.ui } as const;

/** Переключает фазы появления главного экрана по сценарию. Возвращает отмену. */
export function scheduleSplash(still: boolean, setPhase: (phase: EntrancePhase) => void): () => void {
  const gate = still ? STILL.hold : T.gate;
  const end = still ? STILL.hold + STILL.fade : T.end;
  const timers = [setTimeout(() => setPhase('reveal'), gate), setTimeout(() => setPhase('done'), end)];
  return () => timers.forEach(clearTimeout);
}
