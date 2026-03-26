import { useCallback } from "react";

import { playAudio } from "@/lib/audio/play-audio";
import { useAutoPlayStore } from "@/stores/auto-play-store";

export function useAutoPlayAudio() {
  const enabled = useAutoPlayStore((s) => s.enabled);

  const playIfEnabled = useCallback(
    (url: string | null | undefined) => {
      if (!enabled || !url) return;
      playAudio(url);
    },
    [enabled]
  );

  const forcePlay = useCallback((url: string | null | undefined) => {
    if (!url) return;
    playAudio(url);
  }, []);

  return { isAutoPlayEnabled: enabled, playIfEnabled, forcePlay };
}
