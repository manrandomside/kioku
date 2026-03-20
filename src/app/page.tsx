import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-primary">
          kioku
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Platform belajar kosakata bahasa Jepang
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          Masuk
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Daftar
        </Link>
      </div>
    </main>
  );
}
