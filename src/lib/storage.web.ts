import { createJSONStorage } from 'zustand/middleware';

/** Веб-превью: expo-sqlite в вебе требует wasm и особых заголовков, для проверки хватает localStorage. */
export const persistStorage = createJSONStorage(() => localStorage);
