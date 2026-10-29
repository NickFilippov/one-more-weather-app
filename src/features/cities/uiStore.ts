import { create } from 'zustand';

/** Через него экран городов говорит главному экрану, какую страницу открыть. */
interface UiState {
  activeCityId: string | null;
  setActiveCityId(id: string | null): void;
}

export const useUiStore = create<UiState>()((set) => ({
  activeCityId: null,
  setActiveCityId: (id) => set({ activeCityId: id }),
}));
