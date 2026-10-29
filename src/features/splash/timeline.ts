import type { EntrancePhase } from '@/lib/entrance';
import { duration } from '@/theme/tokens';

/**
 * Сценарий сплэша «Восход», мс от момента, когда нативная заставка сменилась слоем SplashOverlay.
 * Макет: доски «iPhone · сплэш» и «Android · сплэш»; подробности в docs/tech/04-ui-spec.md.
 */
export const T = {
  /** Солнце поднимается над горизонтом сразу, без паузы: кадр не должен казаться зависшим. */
  rise: 0,
  riseDur: 650,
  /** One, More, Weather, App всплывают по одному. */
  words: [200, 320, 440, 580],
  wordDur: 640,
  accentDur: 780,
  /**
   * Кадр собран, ничего не движется: здесь монтируется главный экран, и часы ждут, пока он
   * нарисуется. Тяжёлый монтаж (на Android около секунды) приходится на неподвижный кадр,
   * а не рвёт восход или уход сцены.
   */
  hold: 1250,
  /** Дольше этого главный экран не ждём. */
  maxHold: 3000,
  /** Главный экран начинает появляться, пока ещё под сплэшем. */
  gate: 1350,
  /** Тьма отступает от точки восхода к краям. */
  reveal: 1400,
  revealDur: 1000,
  /** Камера поднимает взгляд: горизонт и название уходят вниз, солнце летит в правый верхний угол. */
  out: 1500,
  nameOutDur: 450,
  sceneOutDur: 700,
  /** Слой сплэша снят. */
  end: 2450,
} as const;

/** «Уменьшение движения»: кадр с названием стоит, потом гаснет. */
export const STILL = { hold: 900, fade: duration.ui } as const;

/**
 * Фазы появления при «Уменьшении движения»: часов нет, кадр стоит и гаснет по таймерам.
 * В обычном сценарии фазы переключают часы сплэша (SplashOverlay). Возвращает отмену.
 */
export function scheduleStillSplash(setPhase: (phase: EntrancePhase) => void): () => void {
  const timers = [
    setTimeout(() => setPhase('reveal'), STILL.hold),
    setTimeout(() => setPhase('done'), STILL.hold + STILL.fade),
  ];
  return () => timers.forEach(clearTimeout);
}
