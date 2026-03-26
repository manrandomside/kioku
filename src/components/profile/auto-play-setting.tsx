"use client";

import { useAutoPlayStore } from "@/stores/auto-play-store";
import { updateAutoPlayAudio } from "@/app/actions/user-settings";

interface AutoPlaySettingProps {
  initialEnabled: boolean;
}

export function AutoPlaySetting({ initialEnabled }: AutoPlaySettingProps) {
  const enabled = useAutoPlayStore((s) => s.enabled);
  const setEnabled = useAutoPlayStore((s) => s.setEnabled);

  // Use store value, falling back to initial
  const isEnabled = enabled ?? initialEnabled;

  function handleToggle() {
    const newValue = !isEnabled;
    setEnabled(newValue);
    updateAutoPlayAudio(newValue);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold">Auto-play Audio</p>
        <p className="text-xs text-muted-foreground">
          Putar audio otomatis saat kartu dibalik atau soal muncul
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        onClick={handleToggle}
        className={
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors " +
          (isEnabled ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform " +
            (isEnabled ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}
