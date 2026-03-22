"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { getSoundEnabled, setSoundEnabled } from "@/lib/audio/sound-effects";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(getSoundEnabled());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Efek suara"
      >
        <Volume2 className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        setSoundEnabled(next);
      }}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={enabled ? "Matikan efek suara" : "Nyalakan efek suara"}
      title={enabled ? "Efek suara: ON" : "Efek suara: OFF"}
    >
      {enabled ? (
        <Volume2 className="size-4" />
      ) : (
        <VolumeX className="size-4" />
      )}
    </button>
  );
}
