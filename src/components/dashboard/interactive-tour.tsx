"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { useTourStore } from "@/stores/tour-store";

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
      "Platform belajar bahasa Jepang dengan metode saintifik. Mari kami pandu sejenak.",
  },
  {
    target: "tour-sidebar",
    mobileTarget: "tour-bottom-nav",
    title: "Menu Navigasi",
    description:
      "Akses cepat ke Belajar, Review, AI Tutor, dan Profil kamu. Di Kioku, semua kemajuanmu tersinkronisasi secara real-time.",
  },
  {
    target: "tour-smart-study",
    title: "Smart Study",
    description:
      "Fitur unggulan kami. Dalam satu sesi, kamu akan melakukan Review kartu lama, mempelajari Kata Baru, dan diakhiri dengan Quiz interaktif untuk memperkuat ingatan.",
  },
  {
    target: "tour-learn-hub",
    title: "Pusat Belajar",
    description:
      "Di sini kamu bisa memilih materi HIRAKATA (untuk pemula) atau 50 Bab Minna no Nihongo (MNN) yang mencakup 2.900+ kosakata.",
  },
  {
    target: "tour-ai-tutor",
    title: "Sensei AI",
    description:
      "Punya pertanyaan grammar? Ingin latihan percakapan? AI Tutor kami siap menjawab dalam Bahasa Indonesia 24/7.",
  },
  {
    target: "tour-streak",
    title: "Pantau Progres",
    description:
      "Jaga streak harianmu, kumpulkan XP, dan raih 50+ Achievement badges untuk memotivasi belajarmu.",
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

export function InteractiveTour() {
  const { isActive, currentStep, hasSeenTour, startTour, nextStep, prevStep, closeTour, completeTour } =
    useTourStore();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
    placement: "top" | "bottom";
    isMobileCentered: boolean;
  }>({
    x: 0,
    y: 0,
    placement: "bottom",
    isMobileCentered: false,
  });
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

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!step || isWelcomeStep) {
      setTargetRect(null);
      setTooltipPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: "bottom",
        isMobileCentered: false,
      });
      return;
    }

    const targetId = resolveTargetId(step);
    const el = document.getElementById(targetId);
    if (!el) {
      // Element not found — center tooltip as fallback
      setTargetRect(null);
      setTooltipPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: "bottom",
        isMobileCentered: false,
      });
      return;
    }

    // Only scroll dashboard content elements into view; skip fixed elements like sidebar/bottom-nav
    const isFixedElement = targetId === "tour-sidebar" || targetId === "tour-bottom-nav" ||
      targetId === "tour-ai-tutor" || targetId === "tour-learn-hub";
    if (!isFixedElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Delay measurement to allow scroll to settle
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const newRect: TargetRect = {
        x: rect.left - SPOTLIGHT_PADDING,
        y: rect.top - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };
      setTargetRect(newRect);

      // Mobile: fixed-position tooltip at bottom or top center
      if (vw < MOBILE_BREAKPOINT) {
        // Determine if target is in top or bottom half of screen
        const targetCenterY = rect.top + rect.height / 2;
        const placement: "top" | "bottom" = targetCenterY < vh / 2 ? "bottom" : "top";

        setTooltipPosition({
          x: vw / 2,
          y: placement === "bottom"
            ? Math.min(rect.bottom + SPOTLIGHT_PADDING + 20, vh - 200)
            : Math.max(rect.top - SPOTLIGHT_PADDING - 20, 100),
          placement,
          isMobileCentered: true,
        });
        return;
      }

      // Desktop: position near target element
      const tooltipWidth = 380;
      const tooltipHeight = 200;

      const spaceBelow = vh - (rect.bottom + SPOTLIGHT_PADDING);
      const placement: "top" | "bottom" = spaceBelow >= tooltipHeight + 24 ? "bottom" : "top";

      let tooltipX = rect.left + rect.width / 2;
      // Clamp to viewport
      tooltipX = Math.max(tooltipWidth / 2 + 16, Math.min(vw - tooltipWidth / 2 - 16, tooltipX));

      let tooltipY: number;
      if (placement === "bottom") {
        tooltipY = rect.bottom + SPOTLIGHT_PADDING + 16;
      } else {
        tooltipY = rect.top - SPOTLIGHT_PADDING - 16;
      }

      setTooltipPosition({ x: tooltipX, y: tooltipY, placement, isMobileCentered: false });
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

  // Auto-start tour on first visit
  useEffect(() => {
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, startTour]);

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

          {/* Tooltip Card */}
          <motion.div
            className="absolute z-[101]"
            style={{ pointerEvents: "auto" }}
            initial={false}
            animate={{
              x: "-50%",
              y: isWelcomeStep
                ? "-50%"
                : tooltipPosition.isMobileCentered
                  ? "-50%"
                  : tooltipPosition.placement === "bottom"
                    ? 0
                    : "-100%",
              left: tooltipPosition.x,
              top: isWelcomeStep
                ? tooltipPosition.y
                : tooltipPosition.isMobileCentered
                  ? tooltipPosition.placement === "bottom"
                    ? tooltipPosition.y
                    : tooltipPosition.y
                  : tooltipPosition.y,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <motion.div
              className="mx-4 w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border border-[#C2E959]/40 bg-card/90 p-5 shadow-2xl backdrop-blur-xl sm:mx-0 sm:w-[380px]"
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
