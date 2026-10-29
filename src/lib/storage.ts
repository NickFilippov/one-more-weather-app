import Storage from 'expo-sqlite/kv-store';
import { createJSONStorage } from 'zustand/middleware';

export const persistStorage = createJSONStorage(() => Storage);
