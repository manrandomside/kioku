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

  if (variant === "landing") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full bg-[#0A3A3A] border-b border-[#C2E959]/20"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <Smartphone className="size-4 text-[#C2E959]" />
              <p className="text-sm text-white/80">
                Install Kioku di perangkatmu untuk akses lebih cepat
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 rounded-full bg-[#C2E959] px-4 py-1.5 text-xs font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/90"
              >
                <Download className="size-3" />
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center justify-between rounded-2xl border border-[#C2E959]/20 bg-[#C2E959]/5 px-4 py-3 sm:px-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#C2E959]/15">
            <Smartphone className="size-4.5 text-[#C2E959]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Install Kioku</p>
            <p className="text-xs text-muted-foreground">
              Akses lebih cepat dari home screen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-full bg-[#C2E959] px-4 py-2 text-xs font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/90"
          >
            <Download className="size-3.5" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
