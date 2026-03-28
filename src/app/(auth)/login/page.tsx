"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { signInWithEmail } from "@/app/(auth)/actions";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const authError = searchParams.get("error");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signInWithEmail(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Masuk ke Kioku
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Masuk ke akun kamu untuk melanjutkan belajar
        </p>
      </div>

      {message === "check_email" && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
          Cek email kamu untuk verifikasi akun.
        </div>
      )}

      {authError === "auth_failed" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          Autentikasi gagal. Silakan coba lagi.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">atau</span>
        <Separator className="flex-1" />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            required
            autoComplete="email"
            className="h-11 rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/magic-link"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Lupa password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Masukkan password"
            required
            autoComplete="current-password"
            className="h-11 rounded-xl"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-[#C2E959] text-base font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
