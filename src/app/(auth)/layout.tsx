import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Sparkles } from "lucide-react";

import { Logo } from "@/components/ui/logo";

const FEATURES = [
  { icon: BookOpen, text: "2.900+ kosakata Minna no Nihongo" },
  { icon: Brain, text: "Spaced repetition berbasis FSRS" },
  { icon: Sparkles, text: "Gratis selamanya, tanpa batasan" },
];

const KANJI_DECORATIONS = [
  { char: "\u8A18", className: "left-[8%] top-[12%] text-7xl -rotate-12" },
  { char: "\u61B6", className: "right-[10%] top-[20%] text-8xl rotate-6" },
  { char: "\u8A9E", className: "left-[15%] bottom-[25%] text-6xl rotate-12" },
  { char: "\u5B66", className: "right-[18%] bottom-[15%] text-9xl -rotate-6" },
  { char: "\u65E5", className: "left-[40%] top-[60%] text-7xl rotate-3" },
  { char: "\u672C", className: "right-[35%] top-[8%] text-6xl -rotate-9" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left branding panel — always dark */}
      <div className="relative shrink-0 overflow-hidden md:w-[42%] lg:w-[40%]" style={{ background: "linear-gradient(135deg, #0A3A3A 0%, #062828 50%, #0F4F4F 100%)" }}>
        {/* Gradient mesh overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse at 30% 70%, rgba(166,226,172,0.15), transparent 50%)",
              "radial-gradient(ellipse at 70% 30%, rgba(194,233,89,0.1), transparent 50%)",
            ].join(", "),
          }}
        />

        {/* Floating kanji */}
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-jp">
          {KANJI_DECORATIONS.map((k) => (
            <span
              key={k.char}
              className={`absolute text-white/[0.06] ${k.className}`}
            >
              {k.char}
            </span>
          ))}
        </div>

        {/* Content — compact on mobile, full on desktop */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 text-center md:h-full md:items-start md:px-10 md:py-12 md:text-left lg:px-14">
          {/* Logo (always white version on dark bg) */}
          <img
            src="/logo-white.svg"
            alt="Kioku"
            className="h-8 w-auto md:h-9"
          />

          {/* Tagline — hidden on mobile for compactness */}
          <h2 className="mt-4 hidden font-display text-xl font-bold leading-snug tracking-tight text-white/90 md:block lg:text-2xl">
            Kuasai Kosakata Jepang dengan Metode Saintifik
          </h2>
          <p className="mt-2 text-sm text-white/60 md:hidden">
            Platform belajar bahasa Jepang gratis
          </p>

          {/* Feature points — hidden on mobile */}
          <div className="mt-8 hidden flex-col gap-4 md:flex">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="size-4 text-[#C2E959]" />
                </div>
                <span className="text-sm text-white/70">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col bg-background">
        {/* Back link */}
        <div className="px-4 pt-4 sm:px-6 sm:pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Form container — centered */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
