import Link from "next/link";
import { BookOpen, Languages, Info } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Pilih Materi Belajar
        </h1>
        <p className="mt-1 text-muted-foreground">
          Mulai dari mana kamu mau belajar hari ini?
        </p>
      </div>

      {/* Hero Cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Card 1 — Hirakata */}
        <Link
          href="/learn/hirakata"
          className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#248288]/10 to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#248288]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
        >
          {/* Decorative characters */}
          <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp">
            <span className="text-[120px] leading-none text-foreground/[0.06] -rotate-[10deg] inline-block">
              {"\u3042"}
            </span>
            <span className="text-[100px] leading-none text-foreground/[0.04] rotate-[5deg] inline-block -ml-8">
              {"\u30A2"}
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#248288]/15">
              <Languages className="size-7 text-[#248288]" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Hiragana & Katakana</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Langkah pertama untuk membaca bahasa Jepang
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Pelajari 214 karakter dasar dengan flashcard interaktif dan quiz. Fondasi wajib sebelum mulai kosakata.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#248288]/15 px-3 py-1 text-xs font-medium text-[#248288]">
                Pemula
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                214 Karakter
              </span>
            </div>
          </div>
        </Link>

        {/* Card 2 — Minna no Nihongo */}
        <Link
          href="/learn/mnn"
          className="group relative min-h-[180px] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[#C2E959]/[0.08] to-transparent p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[#C2E959]/50 hover:shadow-xl sm:p-8 lg:min-h-[220px]"
        >
          {/* Decorative characters */}
          <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-jp">
            <span className="text-[120px] leading-none text-foreground/[0.05] rotate-[8deg] inline-block">
              {"\u6F22"}
            </span>
            <span className="text-[100px] leading-none text-foreground/[0.04] -rotate-[5deg] inline-block -ml-10">
              {"\u5B57"}
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#C2E959]/15">
              <BookOpen className="size-7 text-[#C2E959]" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Minna no Nihongo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kosakata lengkap dari buku standar bahasa Jepang
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              2.900+ kosakata dari Bab 1-50 (MNN I & II). Dipetakan ke JLPT N5 dan N4 dengan terjemahan Bahasa Indonesia.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#C2E959]/15 px-3 py-1 text-xs font-medium text-[#C2E959]">
                JLPT N5-N4
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                50 Bab
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                2.900+ Kata
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Tips bar */}
      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-400" />
        <p className="text-sm text-muted-foreground">
          Baru pertama kali? Mulai dari <strong className="text-foreground">Hiragana & Katakana</strong> agar bisa membaca huruf Jepang.
        </p>
      </div>
    </div>
  );
}
