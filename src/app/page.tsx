"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LazyMotion, domAnimation, m, useInView, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Layers,
  Zap,
  Bot,
  Volume2,
  Trophy,
  UserPlus,
  Brain,
  Menu,
  X,
  ArrowRight,
  Github,
} from "lucide-react";

import { Logo } from "@/components/ui/logo";

const InstallBanner = dynamic(
  () =>
    import("@/components/pwa/install-banner").then((mod) => ({
      default: mod.InstallBanner,
    })),
  { ssr: false },
);
const InstallTextTrigger = dynamic(
  () =>
    import("@/components/pwa/install-text-trigger").then((mod) => ({
      default: mod.InstallTextTrigger,
    })),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const dirMap = {
    up: { y: 40, x: 0 },
    left: { y: 0, x: -40 },
    right: { y: 0, x: 40 },
    none: { y: 0, x: 0 },
  };

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </m.div>
  );
}

function CountUpNumber({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: BookOpen,
    title: "Konten Minna no Nihongo",
    desc: "Kosakata lengkap dari buku MNN I & II (Bab 1-50), dipetakan ke JLPT N5 dan N4. Terjemahan Bahasa Indonesia yang akurat.",
    color: "text-[#248288]",
    bg: "bg-[#248288]/10",
  },
  {
    icon: Layers,
    title: "Flashcard Cerdas (FSRS)",
    desc: "Sistem pengulangan berjarak berbasis sains. Algoritma yang sama digunakan Anki \u2014 20-30% lebih efisien dari metode tradisional.",
    color: "text-[#C2E959]",
    bg: "bg-[#C2E959]/10",
  },
  {
    icon: Zap,
    title: "Quiz Interaktif",
    desc: "7 tipe soal berbeda bergaya Duolingo: pilihan ganda, audio, ketik hiragana, isi titik-titik, dan lainnya.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Bot,
    title: "AI Tutor Sensei",
    desc: "Chatbot AI yang memahami level kamu. Tanya tentang grammar, budaya, atau latihan percakapan \u2014 semuanya dalam Bahasa Indonesia.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Volume2,
    title: "Audio Native Speaker",
    desc: "3.000+ file audio berkualitas tinggi dengan suara natural Jepang. Dengarkan pengucapan yang benar untuk setiap kata.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Trophy,
    title: "Gamifikasi & Streak",
    desc: "Sistem XP, level, streak harian, dan 50+ achievement badge. Belajar terasa seperti bermain game.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Daftar Gratis",
    desc: "Buat akun dengan Google, atau email. Selesaikan onboarding 30 detik untuk personalisasi.",
    icon: UserPlus,
  },
  {
    num: "02",
    title: "Pilih Bab & Mulai Belajar",
    desc: "Mulai dari Hiragana & Katakana, atau langsung ke kosakata MNN sesuai levelmu.",
    icon: BookOpen,
  },
  {
    num: "03",
    title: "Review & Kuasai",
    desc: "Algoritma FSRS mengingatkanmu kapan harus review. Semakin rutin, semakin cepat kamu menguasai.",
    icon: Brain,
  },
];

const STATS = [
  { value: 2900, suffix: "+", label: "Kosakata MNN" },
  { value: 50, suffix: "", label: "Bab Pelajaran" },
  { value: 214, suffix: "", label: "Huruf Kana" },
  { value: 7, suffix: "", label: "Tipe Soal Quiz" },
];

const TECH = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "Supabase",
  "Drizzle ORM",
  "FSRS",
  "Vercel AI SDK",
  "Framer Motion",
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Fitur", href: "#fitur" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Metode", href: "#metode" },
    { label: "Preview", href: "#preview" },
    { label: "Panduan", href: "/guidebook/kioku-guidebook.pdf" },
  ];

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-background/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#" className="shrink-0">
          <Logo size="md" />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.endsWith(".pdf") ? "_blank" : undefined}
              rel={l.href.endsWith(".pdf") ? "noopener noreferrer" : undefined}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#C2E959] px-5 py-2 text-sm font-semibold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80"
          >
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1 px-4 pb-4 pt-2">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.href.endsWith(".pdf") ? "_blank" : undefined}
                rel={l.href.endsWith(".pdf") ? "noopener noreferrer" : undefined}
                onClick={() => {
                  if (!l.href.endsWith(".pdf")) setOpen(false);
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#C2E959] px-4 py-2.5 text-center text-sm font-semibold text-[#0A3A3A]"
              >
                Mulai Gratis
              </Link>
            </div>
          </div>
        </m.div>
      )}
    </nav>
  );
}

const HERO_VOCAB = [
  { kanji: null, reading: "\u308F\u305F\u3057", romaji: "watashi", meaning: "Saya (Bab 1)" },
  { kanji: "\u5148\u751F", reading: "\u305B\u3093\u305B\u3044", romaji: "sensei", meaning: "Guru (Bab 1)" },
  { kanji: null, reading: "\u3053\u308C", romaji: "kore", meaning: "Ini (Bab 2)" },
  { kanji: "\u65E5\u672C\u8A9E", reading: "\u306B\u307B\u3093\u3054", romaji: "nihongo", meaning: "Bahasa Jepang (Bab 2)" },
  { kanji: "\u5B66\u751F", reading: "\u304C\u304F\u305B\u3044", romaji: "gakusei", meaning: "Mahasiswa (Bab 1)" },
  { kanji: "\u53CB\u9054", reading: "\u3068\u3082\u3060\u3061", romaji: "tomodachi", meaning: "Teman (Bab 1)" },
];

function FlashcardMockup() {
  const [vocabIndex, setVocabIndex] = useState(0);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mockupRef, { once: true, margin: "-100px" });

  // Start cycling after initial entrance animation completes
  useEffect(() => {
    if (!inView) return;
    const entranceTimer = setTimeout(() => setHasEnteredView(true), 2200);
    return () => clearTimeout(entranceTimer);
  }, [inView]);

  useEffect(() => {
    if (!hasEnteredView) return;
    const interval = setInterval(() => {
      setVocabIndex((prev) => (prev + 1) % HERO_VOCAB.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hasEnteredView]);

  const vocab = HERO_VOCAB[vocabIndex];

  return (
    <div ref={mockupRef} className="relative mx-auto w-[280px] sm:w-[320px]">
      {/* Ambient glow behind the phone */}
      <div className="pointer-events-none absolute -inset-8 -z-10 animate-[glow-pulse_4s_ease-in-out_infinite] rounded-full bg-[#C2E959]/8 blur-3xl" />

      {/* Phone frame with gentle floating */}
      <m.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="overflow-hidden rounded-[2rem] border-2 border-border/50 bg-card p-3 shadow-2xl"
      >
        {/* Status bar */}
        <div className="mb-3 flex items-center justify-between px-2 text-[10px] text-muted-foreground">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="h-1.5 w-4 rounded-full bg-muted-foreground/30" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
          </div>
        </div>

        {/* Card */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border/50 bg-background px-4 py-8"
        >
          {/* Shimmer sweep */}
          <m.div
            className="pointer-events-none absolute inset-0 -z-0"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent" />
          </m.div>

           {/* Cycling vocabulary content — fixed height to prevent layout shift */}
          <AnimatePresence mode="wait">
            <m.div
              key={vocabIndex}
              initial={hasEnteredView ? { opacity: 0, y: 20, scale: 0.95 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative flex h-[100px] flex-col items-center justify-center gap-2"
            >
              <span className={`font-jp text-sm ${vocab.kanji ? "text-muted-foreground" : "text-transparent select-none"}`}>
                {vocab.kanji || "\u3000"}
              </span>
              <span className="font-jp text-4xl font-medium text-foreground">
                {vocab.reading}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {vocab.romaji}
              </span>
            </m.div>
          </AnimatePresence>

          <m.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.3, duration: 0.6, ease: "easeOut" }}
            className="mt-2 h-px w-full origin-left bg-border"
          />

          <AnimatePresence mode="wait">
            <m.span
              key={`meaning-${vocabIndex}`}
              initial={hasEnteredView ? { opacity: 0, y: 10 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative h-5 text-sm text-muted-foreground"
            >
              {vocab.meaning}
            </m.span>
          </AnimatePresence>
        </m.div>

        {/* Buttons with staggered entrance and hover glow */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            className="rounded-xl bg-red-500/10 py-2.5 text-center text-xs font-medium text-red-500 transition-shadow hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Belum Paham
          </m.div>
          <m.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            className="rounded-xl bg-green-500/10 py-2.5 text-center text-xs font-medium text-green-500 transition-shadow hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            Sudah Paham
          </m.div>
        </div>
      </m.div>

      {/* Floating badges — each with unique floating rhythm */}
      <m.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { delay: 0.8, duration: 0.5 },
          scale: { delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 },
          y: { delay: 1.3, duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute -right-4 top-8 rounded-full border border-border/50 bg-card px-3 py-1.5 text-xs font-medium shadow-lg sm:-right-8"
      >
        <span className="text-[#C2E959]">2900+</span> Kosakata
      </m.div>
      <m.div
        initial={{ opacity: 0, scale: 0.6, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: [0, -5, 0] }}
        transition={{
          opacity: { delay: 1.0, duration: 0.5 },
          scale: { delay: 1.0, duration: 0.5, type: "spring", stiffness: 200 },
          x: { delay: 1.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute -left-4 top-1/2 rounded-full border border-border/50 bg-card px-3 py-1.5 text-xs font-medium shadow-lg sm:-left-8"
      >
        JLPT <span className="text-[#248288]">N5-N4</span>
      </m.div>
      <m.div
        initial={{ opacity: 0, scale: 0.6, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
        transition={{
          opacity: { delay: 1.2, duration: 0.5 },
          scale: { delay: 1.2, duration: 0.5, type: "spring", stiffness: 200 },
          y: { delay: 1.7, duration: 4.5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute -right-2 bottom-16 rounded-full border border-border/50 bg-card px-3 py-1.5 text-xs font-medium shadow-lg sm:-right-6"
      >
        <span className="text-purple-500">AI</span> Tutor
      </m.div>
    </div>
  );
}

function PreviewTabs() {
  const tabKeys = ["flashcard", "quiz", "chat"] as const;
  type TabKey = (typeof tabKeys)[number];
  const [tab, setTab] = useState<TabKey>("flashcard");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabs = [
    { key: "flashcard" as const, label: "Flashcard" },
    { key: "quiz" as const, label: "Quiz" },
    { key: "chat" as const, label: "AI Tutor" },
  ];

  const AUTO_CYCLE_MS = 6000;
  const TICK_MS = 50;

  // Auto-cycle logic
  useEffect(() => {
    setProgress(0);
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += TICK_MS;
      setProgress(Math.min((elapsed / AUTO_CYCLE_MS) * 100, 100));

      if (elapsed >= AUTO_CYCLE_MS) {
        setTab((prev) => {
          const idx = tabKeys.indexOf(prev);
          return tabKeys[(idx + 1) % tabKeys.length];
        });
        elapsed = 0;
        setProgress(0);
      }
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleTabClick = useCallback((key: TabKey) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTab(key);
    setProgress(0);
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Tab bar */}
      <div className="mb-6 flex justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabClick(t.key)}
            className={`relative overflow-hidden rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-[#C2E959] text-[#0A3A3A]"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span
                className="absolute bottom-0 left-0 h-0.5 bg-[#0A3A3A]/30 transition-none"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Mockup container — fixed min-height prevents layout shift between tabs */}
      <div className="min-h-[420px] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "flashcard" && (
            <m.div
              key="flashcard"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 sm:p-10"
            >
              <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-background px-6 py-10 text-center">
                <p className="font-jp text-sm text-transparent select-none">
                  {"\u3000"}
                </p>
                <p className="mt-2 font-jp text-5xl font-medium text-foreground">
                  {"\u3042\u306A\u305F"}
                </p>
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  anata
                </p>
                <div className="mx-auto mt-4 h-px w-2/3 bg-border" />
                <p className="mt-4 text-muted-foreground">Anda (Bab 1)</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap kartu untuk membalik
              </p>
              <div className="flex w-full max-w-sm gap-3">
                <div className="flex-1 rounded-xl bg-red-500/10 py-3 text-center text-sm font-medium text-red-500">
                  Belum Paham
                </div>
                <div className="flex-1 rounded-xl bg-green-500/10 py-3 text-center text-sm font-medium text-green-500">
                  Sudah Paham
                </div>
              </div>
            </m.div>
          )}

          {tab === "quiz" && (
            <m.div
              key="quiz"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex min-h-[420px] flex-col justify-center gap-5 p-6 sm:p-10"
            >
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/2 rounded-full bg-[#C2E959]" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  10/20
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Apa arti dari kata ini?
              </p>
              <p className="text-center font-jp text-4xl font-medium text-foreground">
                {"\u304A\u306F\u3088\u3046\u3054\u3056\u3044\u307E\u3059"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border-2 border-green-500 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                  Selamat pagi (sopan)
                </div>
                <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                  Selamat siang
                </div>
                <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                  Selamat malam
                </div>
                <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                  Terima kasih
                </div>
              </div>
            </m.div>
          )}

          {tab === "chat" && (
            <m.div
              key="chat"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex min-h-[420px] flex-col justify-center gap-4 p-6 sm:p-10"
            >
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#248288] px-4 py-3 text-sm text-white">
                  Sensei, apa bedanya {"\u306F"} dan {"\u304C"}?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
                  <p className="mb-2 font-medium">Pertanyaan bagus!</p>
                  <p className="text-muted-foreground">
                    Secara sederhana:{" "}
                    <span className="font-jp font-medium text-foreground">
                      {"\u306F"}
                    </span>{" "}
                    (wa) menandai <strong>topik</strong> pembicaraan, sedangkan{" "}
                    <span className="font-jp font-medium text-foreground">
                      {"\u304C"}
                    </span>{" "}
                    (ga) menandai <strong>subjek gramatikal</strong> yang baru
                    atau ditekankan...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                <span className="flex-1 text-sm text-muted-foreground">
                  Ketik pertanyaan...
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ForgettingCurve() {
  return (
    <div className="w-full max-w-md">
      <svg
        viewBox="0 0 400 200"
        className="w-full"
        role="img"
        aria-label="Forgetting curve comparison"
      >
        {/* Grid lines */}
        <line
          x1="50"
          y1="20"
          x2="50"
          y2="180"
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />
        <line
          x1="50"
          y1="180"
          x2="380"
          y2="180"
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />
        {[60, 100, 140].map((y) => (
          <line
            key={y}
            x1="50"
            y1={y}
            x2="380"
            y2={y}
            stroke="currentColor"
            className="text-border"
            strokeWidth="0.5"
            strokeDasharray="4"
          />
        ))}

        {/* Labels */}
        <text x="25" y="25" className="fill-muted-foreground text-[10px]">
          100%
        </text>
        <text x="25" y="105" className="fill-muted-foreground text-[10px]">
          50%
        </text>
        <text x="25" y="185" className="fill-muted-foreground text-[10px]">
          0%
        </text>
        <text
          x="200"
          y="198"
          className="fill-muted-foreground text-[10px]"
          textAnchor="middle"
        >
          Waktu
        </text>

        {/* Without review — smooth decay */}
        <path
          d="M50,30 C120,40 160,100 200,140 S300,168 380,175"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* With FSRS — repeated review bumps */}
        <path
          d="M50,30 C70,35 80,55 100,60 L100,35 C120,40 130,55 160,60 L160,32 C180,36 190,48 220,52 L220,28 C245,32 260,42 290,45 L290,25 C320,28 350,35 380,38"
          fill="none"
          stroke="#C2E959"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Legend */}
        <line
          x1="220"
          y1="148"
          x2="240"
          y2="148"
          stroke="#EF4444"
          strokeWidth="2.5"
          opacity="0.7"
        />
        <text x="245" y="152" className="fill-muted-foreground text-[10px]">
          Tanpa Review
        </text>
        <line
          x1="220"
          y1="164"
          x2="240"
          y2="164"
          stroke="#C2E959"
          strokeWidth="2.5"
        />
        <text x="245" y="168" className="fill-muted-foreground text-[10px]">
          Dengan FSRS
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <Navbar />

        {/* ========= SECTION 2: HERO ========= */}
        <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
          {/* Gradient mesh background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[10%] top-[30%] h-[600px] w-[600px] rounded-full bg-[#A6E2AC] opacity-[0.12] blur-[120px] dark:opacity-[0.06]" />
            <div className="absolute right-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-[#C2E959] opacity-[0.10] blur-[120px] dark:opacity-[0.05]" />
            <div className="absolute bottom-[10%] left-[40%] h-[400px] w-[400px] rounded-full bg-[#248288] opacity-[0.08] blur-[120px] dark:opacity-[0.04]" />
          </div>

          {/* Floating kanji decorations */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden font-jp"
            aria-hidden="true"
          >
            <span className="absolute left-[8%] top-[15%] text-7xl text-foreground/[0.03]">
              {"\u8A18"}
            </span>
            <span className="absolute right-[12%] top-[25%] text-8xl text-foreground/[0.03]">
              {"\u61B6"}
            </span>
            <span className="absolute bottom-[20%] left-[15%] text-6xl text-foreground/[0.03]">
              {"\u8A9E"}
            </span>
            <span className="absolute bottom-[30%] right-[20%] text-9xl text-foreground/[0.02]">
              {"\u5B66"}
            </span>
          </div>

          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
            {/* Left: Text */}
            <div className="flex flex-col items-start gap-6 pt-8 lg:pt-0">
              <FadeIn>
                <span className="inline-flex rounded-full border border-[#C2E959]/30 bg-[#C2E959]/10 px-4 py-1.5 text-xs font-semibold text-[#C2E959]">
                  Gratis Selamanya &mdash; Tanpa Kartu Kredit
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  Kuasai Kosakata Jepang dengan Cara yang{" "}
                  <span className="text-[#C2E959]">Terbukti Saintifik</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Platform belajar bahasa Jepang gratis untuk penutur Indonesia.
                  Flashcard cerdas, quiz interaktif, dan AI tutor &mdash; semua
                  dalam satu tempat.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 rounded-full bg-[#C2E959] px-8 py-4 text-base font-bold text-[#0A3A3A] transition-[background-color,box-shadow] hover:bg-[#C2E959]/80 hover:shadow-lg hover:shadow-[#C2E959]/20"
                  >
                    Mulai Belajar Gratis
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-full border border-border px-6 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Sudah Punya Akun? Masuk
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right: Mockup */}
            <FadeIn
              delay={0.4}
              direction="right"
              className="flex justify-center lg:justify-end"
            >
              <FlashcardMockup />
            </FadeIn>
          </div>
        </section>

        {/* ========= SECTION 3: STATS BAR ========= */}
        <section className="relative z-10 border-y border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
            {STATS.map((s, i) => (
              <FadeIn
                key={s.label}
                delay={i * 0.1}
                className="flex flex-col items-center gap-1 text-center"
              >
                <span className="font-display text-3xl font-bold text-[#C2E959] sm:text-4xl">
                  <CountUpNumber target={s.value} suffix={s.suffix} />
                </span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ========= SECTION 4: FEATURES GRID ========= */}
        <section id="fitur" className="scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Semua yang Kamu Butuhkan untuk Menguasai Bahasa Jepang
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Fitur lengkap yang dirancang khusus untuk penutur Indonesia
              </p>
            </FadeIn>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.08}>
                  <div className="group flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-[border-color,background-color,box-shadow] hover:border-border hover:bg-card hover:shadow-lg">
                    <div
                      className={`flex size-12 items-center justify-center rounded-xl ${f.bg}`}
                    >
                      <f.icon className={`size-6 ${f.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ========= SECTION 5: HOW IT WORKS ========= */}
        <section
          id="cara-kerja"
          className="scroll-mt-20 border-y border-border/50 bg-muted/30 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Mulai dalam 3 Langkah
              </h2>
            </FadeIn>

            <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {/* Connector line (desktop only) */}
              <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-0.5 bg-gradient-to-r from-transparent via-border to-transparent md:block" />

              {STEPS.map((step, i) => (
                <FadeIn
                  key={step.num}
                  delay={i * 0.15}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 mb-6 flex size-20 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
                    <span className="font-display text-2xl font-bold text-[#C2E959]">
                      {step.num}
                    </span>
                  </div>
                  <step.icon className="mb-3 size-5 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ========= SECTION 6: METHOD / SCIENCE ========= */}
        <section id="metode" className="scroll-mt-20 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <FadeIn>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Ditenagai Spaced Repetition yang{" "}
                  <span className="text-[#C2E959]">Terbukti Saintifik</span>
                </h2>
                <div className="mt-6 flex flex-col gap-4 text-muted-foreground">
                  <p>
                    Kioku menggunakan algoritma{" "}
                    <strong className="text-foreground">FSRS</strong> (Free
                    Spaced Repetition Scheduler), sistem yang sama digunakan
                    Anki versi terbaru.
                  </p>
                  <p>
                    Berbeda dengan metode hafalan biasa, FSRS menghitung waktu
                    review optimal berdasarkan{" "}
                    <strong className="text-foreground">
                      kekuatan memorimu
                    </strong>
                    .
                  </p>
                  <p>
                    Hasilnya? Kamu bisa{" "}
                    <strong className="text-foreground">
                      mengingat lebih banyak kata
                    </strong>{" "}
                    dengan waktu belajar yang lebih sedikit.
                  </p>
                </div>
              </FadeIn>

              <FadeIn
                delay={0.2}
                direction="right"
                className="flex justify-center"
              >
                <ForgettingCurve />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ========= SECTION 7: APP PREVIEW ========= */}
        <section
          id="preview"
          className="scroll-mt-20 border-y border-border/50 bg-muted/30 py-24 sm:py-32"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Lihat Kioku dalam Aksi
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Antarmuka yang bersih dan intuitif, dirancang untuk fokus
                belajar
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <PreviewTabs />
            </FadeIn>
          </div>
        </section>

        {/* ========= SECTION 8: TECH STACK ========= */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Dibangun dengan Teknologi Modern
              </p>
            </FadeIn>
            <FadeIn
              delay={0.1}
              className="flex flex-wrap justify-center gap-2 sm:gap-3"
            >
              {TECH.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/50 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  {t}
                </span>
              ))}
            </FadeIn>
          </div>
        </section>

        {/* ========= SECTION 9: FINAL CTA ========= */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A3A3A]/5 to-[#0A3A3A]/10 dark:via-[#0A3A3A]/20 dark:to-[#0A3A3A]/40" />
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C2E959] opacity-[0.04] blur-[150px]" />
          </div>

          {/* Floating kanji */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden font-jp"
            aria-hidden="true"
          >
            <span className="absolute left-[5%] top-[20%] text-8xl text-foreground/[0.02]">
              {"\u8A18"}
            </span>
            <span className="absolute right-[8%] bottom-[15%] text-9xl text-foreground/[0.02]">
              {"\u61B6"}
            </span>
          </div>

          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <FadeIn>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Siap Mulai Perjalanan Bahasa Jepangmu?
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mt-6 text-lg text-muted-foreground">
                Gratis selamanya. Tanpa iklan. Tanpa batasan.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-full bg-[#C2E959] px-8 py-4 text-base font-bold text-[#0A3A3A] transition-[background-color,box-shadow] hover:bg-[#C2E959]/80 hover:shadow-lg hover:shadow-[#C2E959]/20"
                >
                  Mulai Belajar Sekarang
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#fitur"
                  className="flex items-center gap-2 rounded-full border border-border px-6 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <InstallTextTrigger />
            </FadeIn>
          </div>
        </section>

        {/* ========= SECTION 10: FOOTER ========= */}
        <footer className="relative overflow-hidden border-t border-border/50 bg-card">
          {/* Main footer content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Col 1: Logo + description */}
              <div className="sm:col-span-2 lg:col-span-1">
                <Logo size="md" />
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Platform belajar kosakata Jepang gratis untuk penutur
                  Indonesia. Dibangun dengan cinta dan teknologi modern.
                </p>
                <a
                  href="https://github.com/manrandomside/kioku"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github className="size-4" />
                  GitHub
                </a>
              </div>

              {/* Col 2: Navigasi */}
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigasi
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Fitur", href: "#fitur" },
                    { label: "Cara Kerja", href: "#cara-kerja" },
                    { label: "Metode", href: "#metode" },
                    { label: "Preview", href: "#preview" },
                    { label: "Panduan", href: "/guidebook/kioku-guidebook.pdf" },
                  ].map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      target={l.href.endsWith(".pdf") ? "_blank" : undefined}
                      rel={l.href.endsWith(".pdf") ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Col 3: Akun */}
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Akun
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Masuk", href: "/login" },
                    { label: "Daftar Gratis", href: "/register" },
                  ].map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Col 4: Project */}
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Dibangun sebagai project portfolio fullstack + AI.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Next.js", "React", "TypeScript", "Supabase", "FSRS"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
              &copy; 2026 Kioku. Dibuat dengan cinta untuk pembelajar bahasa
              Jepang Indonesia.
            </div>
          </div>

          {/* Large dimmed logo watermark — positioned behind the text, massive size */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center select-none"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt=""
              className="block w-[150vw] max-w-none opacity-[0.02] dark:hidden sm:w-[90vw] lg:w-[60vw]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-white.svg"
              alt=""
              className="hidden w-[150vw] max-w-none opacity-[0.03] dark:block sm:w-[90vw] lg:w-[60vw]"
            />
          </div>
        </footer>

        <InstallBanner variant="landing" />
      </div>
    </LazyMotion>
  );
}
