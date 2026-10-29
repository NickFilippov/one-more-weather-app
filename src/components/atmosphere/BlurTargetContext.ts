import { createContext, useContext, type ComponentRef, type RefObject } from 'react';
import type { View } from 'react-native';

export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>;

/** На Android BlurView размывает только содержимое BlurTargetView. Контекст отдаёт ref неба панелям. */
export const BlurTargetContext = createContext<BlurTargetRef | null>(null);
export const useBlurTarget = (): BlurTargetRef | null => useContext(BlurTargetContext);
