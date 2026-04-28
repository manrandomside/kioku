import { create } from "zustand";
import { persist } from "zustand/middleware";

import { markTourCompleted } from "@/app/actions/tour";

interface TourState {
  hasSeenTour: boolean;
  isActive: boolean;
  currentStep: number;

  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
  completeTour: () => void;
  syncCompletedFromServer: (completed: boolean) => void;
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

      completeTour: () => {
        set({ isActive: false, currentStep: 0, hasSeenTour: true });
        // Fire-and-forget: persist to server, do not block UI
        markTourCompleted().catch((e) => {
          console.warn("[tour-store] markTourCompleted failed:", e);
        });
      },

      syncCompletedFromServer: (completed: boolean) => {
        if (completed) set({ hasSeenTour: true });
      },
    }),
    {
      name: "kioku-tour-storage",
      partialize: (state) => ({ hasSeenTour: state.hasSeenTour }),
    },
  ),
);
