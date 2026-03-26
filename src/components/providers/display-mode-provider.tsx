"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useDisplayModeStore } from "@/stores/display-mode-store";

import type { DisplayMode } from "@/stores/display-mode-store";

interface DisplayModeProviderProps {
  initialMode: DisplayMode;
  children: React.ReactNode;
}

export function DisplayModeProvider({ initialMode, children }: DisplayModeProviderProps) {
  const setGlobalMode = useDisplayModeStore((s) => s.setGlobalMode);
  const clearLocalOverride = useDisplayModeStore((s) => s.clearLocalOverride);
  const pathname = usePathname();

  // Set global mode from server-fetched user preference
  useEffect(() => {
    setGlobalMode(initialMode);
  }, [initialMode, setGlobalMode]);

  // Clear local override on route change
  useEffect(() => {
    clearLocalOverride();
  }, [pathname, clearLocalOverride]);

  return <>{children}</>;
}
