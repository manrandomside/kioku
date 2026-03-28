import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

const FLOATING_KANJI = [
  { char: "迷", className: "top-[8%] left-[5%] text-6xl rotate-[-12deg] opacity-[0.04]" },
  { char: "道", className: "top-[15%] right-[10%] text-8xl rotate-[8deg] opacity-[0.03]" },
  { char: "探", className: "top-[45%] left-[8%] text-7xl rotate-[15deg] opacity-[0.05]" },
  { char: "戻", className: "bottom-[20%] right-[6%] text-[100px] rotate-[-18deg] opacity-[0.03]" },
  { char: "帰", className: "bottom-[10%] left-[15%] text-8xl rotate-[6deg] opacity-[0.04]" },
  { char: "404", className: "top-[30%] right-[3%] text-[150px] rotate-[-5deg] opacity-[0.03] font-bold" },
  { char: "記", className: "top-[70%] left-[3%] text-6xl rotate-[-20deg] opacity-[0.06]" },
  { char: "憶", className: "bottom-[35%] right-[18%] text-7xl rotate-[12deg] opacity-[0.04]" },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A3A3A]">
      {/* Gradient mesh overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(194,233,89,0.08) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(36,130,136,0.12) 0%, transparent 50%), " +
            "radial-gradient(ellipse 50% 50% at 10% 60%, rgba(166,226,172,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Floating kanji decorations */}
      {FLOATING_KANJI.map((item) => (
        <span
          key={item.char}
          className={`pointer-events-none absolute select-none text-white ${item.char === "404" ? "" : "font-jp"} ${item.className}`}
          aria-hidden="true"
        >
          {item.char}
        </span>
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* 404 number */}
        <h1
          className="font-display text-[80px] font-bold leading-none tracking-tight sm:text-[120px] md:text-[160px] lg:text-[200px]"
          style={{
            backgroundImage: "linear-gradient(to right, #C2E959, #248288)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>

        {/* Decorative line */}
        <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-[#C2E959]" />

        {/* Japanese text */}
        <p className="mt-4 font-jp text-lg font-medium text-white/60">
          迷子になりました
        </p>

        {/* Heading */}
        <h2 className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl">
          Halaman Tidak Ditemukan
        </h2>

        {/* Description */}
        <p className="mt-3 max-w-md text-base text-white/60">
          Sepertinya kamu tersesat. Halaman yang kamu cari tidak ada atau sudah
          dipindahkan.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C2E959] px-8 py-3.5 text-base font-bold text-[#0A3A3A] transition-all hover:shadow-lg hover:shadow-[#C2E959]/20 hover:brightness-110"
          >
            <Home className="size-5" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="size-5" />
            Ke Landing Page
          </Link>
        </div>

        {/* Logo */}
        <div className="mt-16 opacity-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" alt="Kioku" className="h-6 w-auto" />
        </div>
      </div>
    </div>
  );
}
