"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "./actions";

const TOTAL_STEPS = 3;

const JLPT_OPTIONS = [
  {
    value: "N5" as const,
    label: "N5 - Pemula",
    description: "Baru mulai belajar bahasa Jepang",
  },
  {
    value: "N4" as const,
    label: "N4 - Dasar",
    description: "Sudah mengerti dasar-dasar bahasa Jepang",
  },
];

const DAILY_GOAL_OPTIONS = [
  { value: "30" as const, label: "Santai", description: "30 XP / hari", minutes: "~5 menit" },
  { value: "50" as const, label: "Reguler", description: "50 XP / hari", minutes: "~10 menit" },
  { value: "100" as const, label: "Serius", description: "100 XP / hari", minutes: "~20 menit" },
  { value: "200" as const, label: "Intens", description: "200 XP / hari", minutes: "~40 menit" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState("");

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [jlptTarget, setJlptTarget] = useState<"N5" | "N4">("N5");
  const [dailyGoalXp, setDailyGoalXp] = useState<"30" | "50" | "100" | "200">("50");

  function goNext() {
    if (step === 1 && !displayName.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    setError("");
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setError("");
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit(hirakataKnown: boolean) {
    startTransition(async () => {
      const result = await completeOnboarding({
        displayName: displayName.trim(),
        preferredName: preferredName.trim() || undefined,
        jlptTarget,
        dailyGoalXp,
        hirakataKnown,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      if (hirakataKnown) {
        router.push("/home");
      } else {
        router.push("/learn/hirakata");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Selamat Datang!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Atur profil kamu untuk memulai belajar bahasa Jepang
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                    ? "bg-[#C2E959] text-[#0A3A3A]"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < TOTAL_STEPS && (
              <div
                className={`h-0.5 w-8 transition-colors ${
                  s < step ? "bg-[#C2E959]" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-8 shadow-lg backdrop-blur-sm">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && (
              <StepProfile
                displayName={displayName}
                setDisplayName={setDisplayName}
                preferredName={preferredName}
                setPreferredName={setPreferredName}
              />
            )}
            {step === 2 && (
              <StepTarget
                jlptTarget={jlptTarget}
                setJlptTarget={setJlptTarget}
                dailyGoalXp={dailyGoalXp}
                setDailyGoalXp={setDailyGoalXp}
              />
            )}
            {step === 3 && (
              <StepAssessment
                onSelect={handleSubmit}
                isPending={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-sm text-[#EF4444]">{error}</p>
        )}

        {/* Navigation */}
        {step < TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={step === 1}
              className={step === 1 ? "invisible" : ""}
            >
              Kembali
            </Button>
            <Button onClick={goNext}>
              Lanjut
            </Button>
          </div>
        )}

        {step === TOTAL_STEPS && (
          <div className="mt-8 flex justify-start">
            <Button variant="ghost" onClick={goBack}>
              Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 1: Profile
function StepProfile({
  displayName,
  setDisplayName,
  preferredName,
  setPreferredName,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  preferredName: string;
  setPreferredName: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-bold">Profil Kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Perkenalkan dirimu untuk pengalaman belajar yang lebih personal
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Nama Lengkap</Label>
          <Input
            id="displayName"
            placeholder="Masukkan nama kamu"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="preferredName">
            Nama Panggilan{" "}
            <span className="text-muted-foreground">(opsional)</span>
          </Label>
          <Input
            id="preferredName"
            placeholder="Nama yang ingin dipanggil"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            maxLength={50}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Learning target
function StepTarget({
  jlptTarget,
  setJlptTarget,
  dailyGoalXp,
  setDailyGoalXp,
}: {
  jlptTarget: "N5" | "N4";
  setJlptTarget: (v: "N5" | "N4") => void;
  dailyGoalXp: "30" | "50" | "100" | "200";
  setDailyGoalXp: (v: "30" | "50" | "100" | "200") => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-bold">Target Belajar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih level dan intensitas belajar yang sesuai
        </p>
      </div>

      {/* JLPT Target */}
      <div className="flex flex-col gap-3">
        <Label>Target JLPT</Label>
        <div className="grid gap-3">
          {JLPT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setJlptTarget(option.value)}
              className={`flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all ${
                jlptTarget === option.value
                  ? "border-[#C2E959] bg-[#C2E959]/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm text-muted-foreground">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="flex flex-col gap-3">
        <Label>Target Harian</Label>
        <div className="grid grid-cols-2 gap-3">
          {DAILY_GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDailyGoalXp(option.value)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all ${
                dailyGoalXp === option.value
                  ? "border-[#C2E959] bg-[#C2E959]/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              }`}
            >
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm font-medium text-[#C2E959]">
                {option.description}
              </span>
              <span className="text-xs text-muted-foreground">
                {option.minutes}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Kana assessment
function StepAssessment({
  onSelect,
  isPending,
}: {
  onSelect: (hirakataKnown: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl font-bold">Asesmen Kana</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Satu pertanyaan terakhir sebelum mulai belajar
        </p>
      </div>

      <div className="rounded-xl bg-muted/50 p-6 text-center">
        <p className="font-jp text-4xl font-bold">
          あ ア
        </p>
        <p className="mt-4 text-lg font-medium">
          Apakah kamu sudah bisa membaca Hiragana & Katakana?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Hiragana dan Katakana adalah huruf dasar bahasa Jepang
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          onClick={() => onSelect(true)}
          disabled={isPending}
          className="h-12"
        >
          {isPending ? "Menyimpan..." : "Ya, saya sudah bisa"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => onSelect(false)}
          disabled={isPending}
          className="h-12"
        >
          {isPending ? "Menyimpan..." : "Belum, saya mau belajar dulu"}
        </Button>
      </div>
    </div>
  );
}
