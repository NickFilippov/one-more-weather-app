import { useAccessibilityFlag } from './useAccessibilityFlag';

export const useReduceTransparency = (): boolean => useAccessibilityFlag('reduceTransparency');
