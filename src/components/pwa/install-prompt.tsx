"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kioku-pwa-dismiss";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed) return;
    setDismissed(false);

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom-4 sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#248288]/10">
          <Download className="size-5 text-[#248288]" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium">Pasang Kioku</p>
          <p className="text-xs text-muted-foreground">
            Akses lebih cepat langsung dari layar utama
          </p>
        </div>

        <button
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-[#248288] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#248288]/80"
        >
          Pasang
        </button>

        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Tutup"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
