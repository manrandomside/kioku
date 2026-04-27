import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TourState {
  hasSeenTour: boolean;
  isActive: boolean;
  currentStep: number;

  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
  completeTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      hasSeenTour: false,
      isActive: false,
      currentStep: 0,

      startTour: () =>
        set({ isActive: true, currentStep: 0 }),

      nextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
        })),

      closeTour: () =>
        set({ isActive: false, currentStep: 0 }),

      completeTour: () =>
        set({ isActive: false, currentStep: 0, hasSeenTour: true }),
    }),
    {
      name: "kioku-tour-storage",
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    },
  ),
);
