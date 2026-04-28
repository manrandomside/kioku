"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { useTourStore } from "@/stores/tour-store";
import { getTourCompletedStatus, markTourCompleted } from "@/app/actions/tour";

interface TourStep {
  target: string;
  /** Fallback target for mobile (e.g. bottom-nav instead of sidebar) */
  mobileTarget?: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "tour-welcome",
    title: "Selamat Datang di Kioku!",
    description:
      "Kioku menggunakan FSRS \u2014 algoritma spaced repetition yang sama dengan Anki, terbukti 20-30% lebih efisien. Mari kami pandu fitur utama dalam 30 detik.",
  },
  {
    target: "tour-sidebar",
    mobileTarget: "tour-bottom-nav",
    title: "Menu Navigasi",
    description:
      "Akses cepat ke Belajar, Review, AI Tutor, dan Profil. Semua progres tersinkronisasi real-time di semua perangkat kamu.",
  },
  {
    target: "tour-smart-study",
    title: "Belajar Sekarang",
    description:
      "Satu klik, satu sesi optimal: Review kartu lama \u2192 Pelajari kata baru \u2192 Quiz untuk memperkuat. Sistem memilih bab dan kartu otomatis sesuai progress kamu.",
  },
  {
    target: "tour-review",
    title: "Review Harian",
    description:
      "Lihat kartu yang jatuh tempo hari ini di sini. Algoritma FSRS mengingatkan kamu tepat waktu agar memori jangka panjang tetap kuat. Skip review = lupa lebih cepat.",
  },
  {
    target: "tour-learn-hub",
    mobileTarget: "tour-learn-hub-mobile",
    title: "Pusat Belajar",
    description:
      "214 karakter Hiragana & Katakana untuk pemula, atau 50 bab Minna no Nihongo dengan 2.909 kosakata MNN lengkap audio dan contoh kalimat.",
  },
  {
    target: "tour-ai-tutor",
    mobileTarget: "tour-ai-tutor-mobile",
    title: "Sensei AI",
    description:
      "Bingung grammar? Mau latihan percakapan? AI Tutor menjawab dalam Bahasa Indonesia, sadar level kamu, dan tersedia 24/7.",
  },
  {
    target: "tour-streak",
    title: "Pantau Progres",
    description:
      "Streak harian, XP yang naik tiap belajar, level 1-60, dan 50 achievement badge. Konsistensi mengalahkan intensitas.",
  },
  {
    target: "tour-user-menu",
    title: "Profil & Panduan",
    description:
      "Klik avatar kamu untuk akses Profil, Panduan Penggunaan PDF lengkap, atau ulang tour ini kapan saja. Semua kontrol akun ada di sini.",
  },
];

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 12;
const MOBILE_BREAKPOINT = 768;
const SAFE_MARGIN = 16;
const TOOLTIP_MAX_WIDTH = 350;
const TOOLTIP_EST_HEIGHT = 220;

export function InteractiveTour() {
  const { isActive, currentStep, hasSeenTour, startTour, nextStep, prevStep, closeTour, completeTour, syncCompletedFromServer } =
    useTourStore();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  // tooltipPos: absolute pixel coordinates for Framer Motion x/y
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  // Computed tooltip width (capped at TOOLTIP_MAX_WIDTH or viewport - 32px)
  const [tooltipWidth, setTooltipWidth] = useState(TOOLTIP_MAX_WIDTH);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isWelcomeStep = step?.target === "tour-welcome";
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const isMobile = windowSize.w > 0 && windowSize.w < MOBILE_BREAKPOINT;

  // Track window size
  useEffect(() => {
    function updateSize() {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Resolve the correct target element ID based on device
  const resolveTargetId = useCallback(
    (s: TourStep): string => {
      if (isMobile && s.mobileTarget) return s.mobileTarget;
      return s.target;
    },
    [isMobile],
  );

  // Measure target element position and compute clamped tooltip coordinates
  const measureTarget = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = Math.min(TOOLTIP_MAX_WIDTH, vw - SAFE_MARGIN * 2);
    setTooltipWidth(tw);

    // Welcome step or missing step: center on screen
    if (!step || isWelcomeStep) {
      setTargetRect(null);
      setTooltipPos({
        x: (vw - tw) / 2,
        y: (vh - TOOLTIP_EST_HEIGHT) / 2,
      });
      return;
    }

    const targetId = resolveTargetId(step);
    const el = document.getElementById(targetId);
    if (!el) {
      // Element not found — center tooltip as fallback
      setTargetRect(null);
      setTooltipPos({
        x: (vw - tw) / 2,
        y: (vh - TOOLTIP_EST_HEIGHT) / 2,
      });
      return;
    }

    // Only scroll dashboard content elements into view; skip fixed elements
    const isFixedElement = targetId === "tour-sidebar" || targetId === "tour-bottom-nav" ||
      targetId === "tour-ai-tutor" || targetId === "tour-learn-hub" ||
      targetId === "tour-user-menu";
    if (!isFixedElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Delay measurement to allow scroll to settle
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const freshVw = window.innerWidth;
      const freshVh = window.innerHeight;
      const freshTw = Math.min(TOOLTIP_MAX_WIDTH, freshVw - SAFE_MARGIN * 2);
      setTooltipWidth(freshTw);

      // Update spotlight rect
      const newRect: TargetRect = {
        x: rect.left - SPOTLIGHT_PADDING,
        y: rect.top - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };
      setTargetRect(newRect);

      // === MOBILE (<768px): tooltip always in safe center area ===
      if (freshVw < MOBILE_BREAKPOINT) {
        const mobileX = (freshVw - freshTw) / 2;
        const targetCenterY = rect.top + rect.height / 2;
        let mobileY: number;

        if (targetCenterY > freshVh * 0.6) {
          // Target is in lower portion (e.g. bottom-nav) — tooltip near top
          mobileY = freshVh * 0.12;
        } else if (targetCenterY < freshVh * 0.35) {
          // Target is in upper portion — tooltip below it
          mobileY = rect.bottom + SPOTLIGHT_PADDING + 20;
        } else {
          // Target is in the middle — tooltip near top
          mobileY = freshVh * 0.08;
        }
        // Final Y clamp
        mobileY = Math.max(SAFE_MARGIN, Math.min(mobileY, freshVh - TOOLTIP_EST_HEIGHT - SAFE_MARGIN));

        setTooltipPos({ x: mobileX, y: mobileY });
        return;
      }

      // === DESKTOP: special handling for sidebar (place tooltip to the RIGHT) ===
      const isSidebarStep = targetId === "tour-sidebar";

      if (isSidebarStep) {
        // Place tooltip to the right of the sidebar
        const tx = rect.right + SPOTLIGHT_PADDING + SAFE_MARGIN;
        // Vertically center on the sidebar, clamped to viewport
        let ty = rect.top + (rect.height / 2) - (TOOLTIP_EST_HEIGHT / 2);
        ty = Math.max(SAFE_MARGIN, Math.min(ty, freshVh - TOOLTIP_EST_HEIGHT - SAFE_MARGIN));
        // If tooltip would go off the right edge, fall back to centering below
        if (tx + freshTw > freshVw - SAFE_MARGIN) {
          const fallbackX = Math.max(SAFE_MARGIN, (freshVw - freshTw) / 2);
          const fallbackY = Math.max(SAFE_MARGIN, rect.bottom + SPOTLIGHT_PADDING + SAFE_MARGIN);
          setTooltipPos({ x: fallbackX, y: Math.min(fallbackY, freshVh - TOOLTIP_EST_HEIGHT - SAFE_MARGIN) });
        } else {
          setTooltipPos({ x: tx, y: ty });
        }
        return;
      }

      // === DESKTOP: default — center on target, above or below ===
      const spaceBelow = freshVh - (rect.bottom + SPOTLIGHT_PADDING);
      const placeBelow = spaceBelow >= TOOLTIP_EST_HEIGHT + 24;

      // X: center tooltip on target element, then clamp to viewport
      let tx = rect.left + (rect.width / 2) - (freshTw / 2);
      tx = Math.max(SAFE_MARGIN, Math.min(tx, freshVw - freshTw - SAFE_MARGIN));

      // Y: position below or above target
      let ty: number;
      if (placeBelow) {
        ty = rect.bottom + SPOTLIGHT_PADDING + SAFE_MARGIN;
      } else {
        ty = rect.top - SPOTLIGHT_PADDING - TOOLTIP_EST_HEIGHT - SAFE_MARGIN;
      }
      // Final Y clamp
      ty = Math.max(SAFE_MARGIN, Math.min(ty, freshVh - TOOLTIP_EST_HEIGHT - SAFE_MARGIN));

      setTooltipPos({ x: tx, y: ty });
    }, isFixedElement ? 100 : 350);
  }, [step, isWelcomeStep, resolveTargetId]);

  // Measure on step change
  useEffect(() => {
    if (!isActive) return;
    measureTarget();
  }, [isActive, currentStep, measureTarget]);

  // Handle window resize with debounce
  useEffect(() => {
    if (!isActive) return;

    function handleResize() {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(measureTarget, 150);
    }

    window.addEventListener("resize", handleResize);
    // Also re-measure on orientation change
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [isActive, measureTarget]);

  // Auto-start tour on first visit (with server-side completion check)
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function bootstrap() {
      try {
        const result = await getTourCompletedStatus();
        if (cancelled) return;

        const serverCompleted = result.success && result.data?.tourCompleted === true;

        // Server says completed -> sync local cache, do not start tour
        if (serverCompleted) {
          syncCompletedFromServer(true);
          return;
        }

        // Local says seen but server does not -> backfill server, do not start tour
        if (hasSeenTour && !serverCompleted) {
          markTourCompleted().catch((e) => {
            console.warn("[interactive-tour] backfill markTourCompleted failed:", e);
          });
          return;
        }

        // Both say not seen -> start the tour
        if (!hasSeenTour && !serverCompleted) {
          timer = setTimeout(() => {
            if (!cancelled) startTour();
          }, 1500);
        }
      } catch (e) {
        // Network failure: fall back to localStorage-only behavior
        console.warn("[interactive-tour] bootstrap failed, falling back to local cache:", e);
        if (!hasSeenTour && !cancelled) {
          timer = setTimeout(() => {
            if (!cancelled) startTour();
          }, 1500);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasSeenTour, startTour, syncCompletedFromServer]);

  // Handle keyboard
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLastStep) {
          completeTour();
        } else {
          nextStep();
        }
      } else if (e.key === "ArrowLeft") {
        if (!isFirstStep) prevStep();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isLastStep, isFirstStep, closeTour, completeTour, nextStep, prevStep]);

  // Build SVG mask for spotlight
  function buildSpotlightClipPath() {
    if (!targetRect) return "";
    const r = 16;
    const vw = windowSize.w || window.innerWidth;
    const vh = windowSize.h || window.innerHeight;
    const { x, y, width, height } = targetRect;
    // Clamp values to prevent negative coordinates
    const cx = Math.max(0, x);
    const cy = Math.max(0, y);
    const cw = Math.min(width, vw - cx);
    const ch = Math.min(height, vh - cy);
    // SVG path: full viewport rect, then inner rounded rect (cut-out via even-odd)
    return `M 0 0 H ${vw} V ${vh} H 0 Z M ${cx + r} ${cy} H ${cx + cw - r} Q ${cx + cw} ${cy} ${cx + cw} ${cy + r} V ${cy + ch - r} Q ${cx + cw} ${cy + ch} ${cx + cw - r} ${cy + ch} H ${cx + r} Q ${cx} ${cy + ch} ${cx} ${cy + ch - r} V ${cy + r} Q ${cx} ${cy} ${cx + r} ${cy} Z`;
  }

  const totalSteps = TOUR_STEPS.length;

  return (
    <AnimatePresence>
      {isActive && step && (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overlay */}
          {isWelcomeStep ? (
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeTour}
            />
          ) : (
            <svg
              className="absolute inset-0 h-full w-full"
              onClick={closeTour}
            >
              <motion.path
                d={buildSpotlightClipPath() || `M 0 0 H ${windowSize.w || 1920} V ${windowSize.h || 1080} H 0 Z`}
                fill="rgba(0, 0, 0, 0.65)"
                fillRule="evenodd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            </svg>
          )}

          {/* Spotlight ring glow */}
          {!isWelcomeStep && targetRect && (
            <motion.div
              className="pointer-events-none absolute rounded-2xl ring-2 ring-[#C2E959]/60 shadow-[0_0_24px_rgba(194,233,89,0.3)]"
              initial={false}
              animate={{
                left: targetRect.x,
                top: targetRect.y,
                width: targetRect.width,
                height: targetRect.height,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          )}

          {/* Tooltip Card — positioned purely via Framer Motion x/y */}
          <motion.div
            className="fixed top-0 left-0 z-[101]"
            style={{ pointerEvents: "auto", width: tooltipWidth }}
            initial={false}
            animate={{
              x: tooltipPos.x,
              y: tooltipPos.y,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <motion.div
              className="w-full rounded-2xl border border-[#C2E959]/40 bg-card/90 p-5 shadow-2xl backdrop-blur-xl"
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              {/* Close button */}
              <button
                onClick={closeTour}
                className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup tour"
              >
                <X className="size-4" />
              </button>

              {/* Icon for welcome */}
              {isWelcomeStep && (
                <motion.div
                  className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#C2E959]/15"
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Sparkles className="size-7 text-[#C2E959]" />
                </motion.div>
              )}

              {/* Title */}
              <motion.h3
                key={`title-${currentStep}`}
                className={`pr-6 font-display text-lg font-bold tracking-tight ${isWelcomeStep ? "text-center" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25 }}
              >
                {step.title}
              </motion.h3>

              {/* Description */}
              <motion.p
                key={`desc-${currentStep}`}
                className={`mt-2 text-sm leading-relaxed text-muted-foreground ${isWelcomeStep ? "text-center" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
              >
                {step.description}
              </motion.p>

              {/* Step counter + dots + buttons */}
              <div className="mt-5 flex items-center justify-between">
                {/* Left: dots + step counter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {TOUR_STEPS.map((_, idx) => (
                      <motion.div
                        key={idx}
                        className={`h-1.5 rounded-full transition-colors ${
                          idx === currentStep
                            ? "w-5 bg-[#C2E959]"
                            : idx < currentStep
                              ? "w-1.5 bg-[#C2E959]/50"
                              : "w-1.5 bg-muted-foreground/30"
                        }`}
                        layout
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    Langkah {currentStep + 1} dari {totalSteps}
                  </span>
                </div>

                {/* Right: navigation buttons */}
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Kembali"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  )}

                  <button
                    onClick={isLastStep ? completeTour : nextStep}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2E959] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    {isLastStep ? (
                      "Selesai"
                    ) : isFirstStep ? (
                      "Mulai"
                    ) : (
                      <>
                        Lanjut
                        <ChevronRight className="size-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
