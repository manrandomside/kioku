import { create } from "zustand";

export type DisplayMode = "kanji" | "kana";

interface DisplayModeState {
  globalMode: DisplayMode;
  localOverride: DisplayMode | null;
  effectiveMode: DisplayMode;
  setGlobalMode: (mode: DisplayMode) => void;
  setLocalOverride: (mode: DisplayMode) => void;
  clearLocalOverride: () => void;
}

export const useDisplayModeStore = create<DisplayModeState>((set, get) => ({
  globalMode: "kanji",
  localOverride: null,
  get effectiveMode() {
    const state = get();
    return state.localOverride ?? state.globalMode;
  },

  setGlobalMode: (mode) =>
    set((state) => ({
      globalMode: mode,
      effectiveMode: state.localOverride ?? mode,
    })),

  setLocalOverride: (mode) =>
    set(() => ({
      localOverride: mode,
      effectiveMode: mode,
    })),

  clearLocalOverride: () =>
    set((state) => ({
      localOverride: null,
      effectiveMode: state.globalMode,
    })),
}));
