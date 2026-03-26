import { create } from "zustand";

interface AutoPlayState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useAutoPlayStore = create<AutoPlayState>((set) => ({
  enabled: true,
  setEnabled: (enabled) => set({ enabled }),
}));
