"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Target,
  BookOpen,
  Check,
  Coffee,
  Flame,
  Zap,
  Rocket,
  Crown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { completeOnboarding } from "./actions";

const TOTAL_STEPS = 3;

const STEP_LABELS = ["Profil", "Target", "Mulai"];

const JLPT_OPTIONS = [
  {
    value: "N5" as const,
    label: "N5",
    subtitle: "Pemula",
    description: "800 kata dasar, tata bahasa sederhana",
    color: "text-green-500",
    bg: "bg-green-500/10",
    borderSelected: "border-green-500",
  },
  {
    value: "N4" as const,
    label: "N4",
    subtitle: "Dasar",
    description: "1.500 kata, percakapan sehari-hari",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    borderSelected: "border-blue-500",
  },
];

const DAILY_GOAL_OPTIONS = [
  { value: "100" as const, label: "Santai", description: "100 XP", minutes: "~10 mnt", icon: Coffee },
  { value: "300" as const, label: "Reguler", description: "300 XP", minutes: "~20 mnt", icon: Flame },
  { value: "500" as const, label: "Serius", description: "500 XP", minutes: "~30 mnt", icon: Zap },
  { value: "750" as const, label: "Intens", description: "750 XP", minutes: "~45 mnt", icon: Rocket },
  { value: "1000" as const, label: "Intensif", description: "1000 XP", minutes: "~60 mnt", icon: Crown },
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
  const [dailyGoalXp, setDailyGoalXp] = useState<"100" | "300" | "500" | "750" | "1000">("100");

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
      {/* Logo */}
      <div className="flex justify-center">
        <img src="/logo-white.svg" alt="Kioku" className="h-7 w-auto" />
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  s === step
                    ? "bg-[#C2E959] text-[#0A3A3A] shadow-lg shadow-[#C2E959]/20"
                    : s < step
                      ? "bg-[#C2E959] text-[#0A3A3A]"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {s < step ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  s
                )}
              </div>
              <span className={`text-[11px] font-medium ${
                s <= step ? "text-white/80" : "text-white/30"
              }`}>
                {STEP_LABELS[s - 1]}
              </span>
            </div>
            {s < TOTAL_STEPS && (
              <div className={`mx-3 mb-5 h-0.5 w-10 rounded-full transition-colors sm:w-14 ${
                s < step
                  ? "bg-gradient-to-r from-[#248288] to-[#C2E959]"
                  : "bg-white/10"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] p-5 shadow-xl backdrop-blur-xl dark:bg-white/[0.05] sm:p-8">
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
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Navigation */}
        {step < TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className={`h-12 rounded-full px-6 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none ${
                step === 1 ? "invisible" : ""
              }`}
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-12 rounded-full bg-[#C2E959] px-8 text-sm font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80"
            >
              Lanjut
            </button>
          </div>
        )}

        {step === TOTAL_STEPS && (
          <div className="mt-8 flex justify-start">
            <button
              type="button"
              onClick={goBack}
              className="h-12 rounded-full px-6 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Kembali
            </button>
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
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/20">
          <User className="size-7 text-[#C2E959]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Kenalan Dulu!</h2>
          <p className="mt-1 text-sm text-white/50">
            Isi nama kamu agar pengalaman belajar lebih personal
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName" className="text-white/70">Nama Lengkap</Label>
          <Input
            id="displayName"
            placeholder="Masukkan nama kamu"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            autoFocus
            className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-[#C2E959]/50 focus-visible:ring-[#C2E959]/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="preferredName" className="text-white/70">
            Nama Panggilan{" "}
            <span className="text-white/30">(opsional)</span>
          </Label>
          <Input
            id="preferredName"
            placeholder="Nama yang ingin dipanggil"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            maxLength={50}
            className="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-[#C2E959]/50 focus-visible:ring-[#C2E959]/20"
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
  dailyGoalXp: "100" | "300" | "500" | "750" | "1000";
  setDailyGoalXp: (v: "100" | "300" | "500" | "750" | "1000") => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/20">
          <Target className="size-7 text-[#C2E959]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Target Belajar</h2>
          <p className="mt-1 text-sm text-white/50">
            Pilih level dan intensitas belajar yang sesuai
          </p>
        </div>
      </div>

      {/* JLPT Target */}
      <div className="flex flex-col gap-3">
        <Label className="text-white/70">Target JLPT</Label>
        <div className="grid gap-3">
          {JLPT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setJlptTarget(option.value)}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                jlptTarget === option.value
                  ? "border-[#C2E959] bg-[#C2E959]/10"
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${option.bg}`}>
                <span className={`text-sm font-bold ${option.color}`}>{option.label}</span>
              </div>
              <div>
                <span className="font-semibold text-white">{option.label} &mdash; {option.subtitle}</span>
                <p className="mt-0.5 text-sm text-white/40">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="flex flex-col gap-3">
        <Label className="text-white/70">Target Harian</Label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {DAILY_GOAL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDailyGoalXp(option.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3.5 transition-all ${
                dailyGoalXp === option.value
                  ? "border-[#C2E959] bg-[#C2E959]/10"
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <option.icon className={`size-5 ${
                dailyGoalXp === option.value ? "text-[#C2E959]" : "text-white/30"
              }`} />
              <span className="text-sm font-semibold text-white">{option.label}</span>
              <span className={`text-xs font-medium ${
                dailyGoalXp === option.value ? "text-[#C2E959]" : "text-white/40"
              }`}>
                {option.description}
              </span>
              <span className="text-[11px] text-white/30">{option.minutes}</span>
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
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/20">
          <BookOpen className="size-7 text-[#C2E959]" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Asesmen Kana</h2>
          <p className="mt-1 text-sm text-white/50">
            Satu pertanyaan terakhir sebelum mulai belajar
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/5 p-6 text-center">
        <p className="font-jp text-4xl font-bold text-white">
          {"\u3042"} {"\u30A2"}
        </p>
        <p className="mt-4 text-lg font-medium text-white">
          Apakah kamu sudah bisa membaca Hiragana & Katakana?
        </p>
        <p className="mt-1 text-sm text-white/40">
          Hiragana dan Katakana adalah huruf dasar bahasa Jepang
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect(true)}
          disabled={isPending}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#248288]/50 bg-[#248288]/10 p-5 transition-all hover:border-[#248288] hover:bg-[#248288]/20 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#248288]/20">
            <Check className="size-5 text-[#248288]" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-white">
            {isPending ? "Menyimpan..." : "Ya, saya sudah bisa"}
          </span>
          <span className="text-xs text-white/40">Langsung mulai kosakata MNN Bab 1</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect(false)}
          disabled={isPending}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#C2E959]/50 bg-[#C2E959]/10 p-5 transition-all hover:border-[#C2E959] hover:bg-[#C2E959]/20 disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-[#C2E959]/20">
            <BookOpen className="size-5 text-[#C2E959]" />
          </div>
          <span className="font-semibold text-white">
            {isPending ? "Menyimpan..." : "Belum, saya mau belajar"}
          </span>
          <span className="text-xs text-white/40">Mulai dari Hiragana & Katakana dasar</span>
        </button>
      </div>
    </div>
  );
}
