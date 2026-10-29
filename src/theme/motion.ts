import { Easing } from 'react-native-reanimated';

export const ease = {
  out: Easing.bezier(0.32, 0.72, 0, 1), // ease-glass дизайн-системы: появления и сдвиги
  spring: Easing.bezier(0.34, 1.56, 0.64, 1), // отпускание кнопки, рост шкалы
  drift: Easing.bezier(0.45, 0, 0.55, 1), // облака, свечение
};

/** Те же кривые как функции прогресса 0…1: для расчётов внутри ворклетов. */
export const curve = {
  out: Easing.bezierFn(0.32, 0.72, 0, 1),
  spring: Easing.bezierFn(0.34, 1.56, 0.64, 1),
};
