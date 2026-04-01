"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallBannerProps {
  variant: "landing" | "dashboard";
}

export function InstallBanner({ variant }: InstallBannerProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(
      `pwa-install-dismissed-${variant}`,
    );
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [variant]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem(`pwa-install-dismissed-${variant}`, "true");
  };

  if (dismissed || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 left-4 z-50 rounded-2xl border border-[#C2E959]/20 bg-[#0A3A3A]/95 p-4 shadow-2xl backdrop-blur-sm sm:left-auto sm:right-6 sm:bottom-6 sm:w-72"
      >
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#C2E959]/15">
            <Smartphone className="size-5 text-[#C2E959]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-white">Install Kioku</p>
            <p className="text-xs text-white/60">
              Akses lebih cepat dari home screen perangkatmu
            </p>
            <button
              onClick={handleInstall}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-full bg-[#C2E959] px-4 py-1.5 text-xs font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/90"
            >
              <Download className="size-3" />
              Install App
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
