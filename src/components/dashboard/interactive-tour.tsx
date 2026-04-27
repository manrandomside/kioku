"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { useTourStore } from "@/stores/tour-store";

interface TourStep {
  target: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "tour-welcome",
    title: "Selamat Datang di Kioku!",
    description:
      "Mari kenali fitur-fitur utama dashboard untuk memaksimalkan belajarmu.",
  },
  {
    target: "tour-smart-study",
    title: "Belajar Sekarang",
    description:
      "Sesi belajar pintar 3 fase. Klik ini setiap hari untuk review dan tambah kosakata baru.",
  },
  {
    target: "tour-streak",
    title: "Jaga Streak-mu",
    description:
      "Konsistensi adalah kunci. Jangan sampai api streak ini padam!",
  },
  {
    target: "tour-review",
    title: "Antrean Review",
    description:
      "Cek berapa kartu yang siap di-review hari ini menggunakan algoritma FSRS.",
  },
  {
    target: "tour-leech",
    title: "Kata Sulit",
    description:
      "Sistem AI mendeteksi kata yang sering kamu lupakan. Latih khusus di sini.",
  },
];

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 12;

export function InteractiveTour() {
  const { isActive, currentStep, hasSeenTour, startTour, nextStep, prevStep, closeTour, completeTour } =
    useTourStore();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; placement: "top" | "bottom" }>({
    x: 0,
    y: 0,
    placement: "bottom",
  });
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isWelcomeStep = step?.target === "tour-welcome";
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!step || isWelcomeStep) {
      setTargetRect(null);
      // Center tooltip for welcome step
      setTooltipPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: "bottom",
      });
      return;
    }

    const el = document.getElementById(step.target);
    if (!el) {
      setTargetRect(null);
      setTooltipPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: "bottom",
      });
      return;
    }

    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Delay measurement to allow scroll to settle
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const newRect: TargetRect = {
        x: rect.left - SPOTLIGHT_PADDING,
        y: rect.top - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };
      setTargetRect(newRect);

      // Calculate tooltip position
      const tooltipWidth = 360;
      const tooltipHeight = 200;
      const viewportHeight = window.innerHeight;

      // Determine vertical placement
      const spaceBelow = viewportHeight - (rect.bottom + SPOTLIGHT_PADDING);
      const placement: "top" | "bottom" = spaceBelow >= tooltipHeight + 24 ? "bottom" : "top";

      let tooltipX = rect.left + rect.width / 2;
      // Clamp to viewport
      tooltipX = Math.max(tooltipWidth / 2 + 16, Math.min(window.innerWidth - tooltipWidth / 2 - 16, tooltipX));

      let tooltipY: number;
      if (placement === "bottom") {
        tooltipY = rect.bottom + SPOTLIGHT_PADDING + 16;
      } else {
        tooltipY = rect.top - SPOTLIGHT_PADDING - 16;
      }

      setTooltipPosition({ x: tooltipX, y: tooltipY, placement });
    }, 350);
  }, [step, isWelcomeStep]);

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
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, [isActive, measureTarget]);

  // Auto-start tour on first visit
  useEffect(() => {
    if (!hasSeenTour) {
      // Small delay to let the dashboard render
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
    const { x, y, width, height } = targetRect;
    // SVG path: full viewport rect, then inner rounded rect (cut-out via even-odd)
    return `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z M ${x + r} ${y} H ${x + width - r} Q ${x + width} ${y} ${x + width} ${y + r} V ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} H ${x + r} Q ${x} ${y + height} ${x} ${y + height - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
  }

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
            // Full dark overlay for welcome step
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeTour}
            />
          ) : (
            // Spotlight overlay with SVG cutout
            <svg
              className="absolute inset-0 h-full w-full"
              onClick={closeTour}
            >
              <motion.path
                d={buildSpotlightClipPath() || `M 0 0 H ${typeof window !== "undefined" ? window.innerWidth : 1920} V ${typeof window !== "undefined" ? window.innerHeight : 1080} H 0 Z`}
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
              x: isWelcomeStep ? "-50%" : "-50%",
              y: isWelcomeStep
                ? "-50%"
                : tooltipPosition.placement === "bottom"
                  ? 0
                  : "-100%",
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <motion.div
              className="w-[340px] rounded-2xl border border-[#C2E959]/40 bg-card/90 p-5 shadow-2xl backdrop-blur-xl sm:w-[380px]"
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

              {/* Step indicator + buttons */}
              <div className="mt-5 flex items-center justify-between">
                {/* Step dots */}
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

                {/* Navigation buttons */}
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
