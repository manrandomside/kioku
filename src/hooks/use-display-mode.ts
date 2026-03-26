"use client";

import { useCallback } from "react";

import { useDisplayModeStore } from "@/stores/display-mode-store";
import { updateDisplayMode } from "@/app/actions/user-settings";

import type { DisplayMode } from "@/stores/display-mode-store";

export function useDisplayMode() {
  const globalMode = useDisplayModeStore((s) => s.globalMode);
  const localOverride = useDisplayModeStore((s) => s.localOverride);
  const setGlobalMode = useDisplayModeStore((s) => s.setGlobalMode);
  const setLocalOverride = useDisplayModeStore((s) => s.setLocalOverride);

  const effectiveMode = localOverride ?? globalMode;

  const toggleLocal = useCallback(
    (mode: DisplayMode) => {
      setLocalOverride(mode);
    },
    [setLocalOverride]
  );

  const toggleGlobal = useCallback(
    async (mode: DisplayMode) => {
      setGlobalMode(mode);
      await updateDisplayMode(mode);
    },
    [setGlobalMode]
  );

  return { effectiveMode, globalMode, toggleLocal, toggleGlobal };
}
