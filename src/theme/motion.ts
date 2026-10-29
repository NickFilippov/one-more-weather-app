import { Easing } from 'react-native-reanimated';

export const ease = {
  glass: Easing.bezier(0.32, 0.72, 0, 1), // появления и сдвиги
  spring: Easing.bezier(0.34, 1.56, 0.64, 1), // отпускание стекла, рост шкалы
  drift: Easing.bezier(0.45, 0, 0.55, 1), // облака, свечение
};
