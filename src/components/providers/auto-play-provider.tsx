"use client";

import { useEffect } from "react";

import { useAutoPlayStore } from "@/stores/auto-play-store";

interface AutoPlayProviderProps {
  initialEnabled: boolean;
  children: React.ReactNode;
}

export function AutoPlayProvider({ initialEnabled, children }: AutoPlayProviderProps) {
  const setEnabled = useAutoPlayStore((s) => s.setEnabled);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled, setEnabled]);

  return <>{children}</>;
}
