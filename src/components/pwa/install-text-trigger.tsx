"use client";

import { useState, useEffect } from "react";
import { Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallTextTrigger() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-white/50 transition-colors hover:text-[#C2E959]"
    >
      <Smartphone className="size-4" />
      <span>Tersedia sebagai aplikasi — install langsung dari browser</span>
    </button>
  );
}
