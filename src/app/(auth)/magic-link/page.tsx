"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { signInWithMagicLink } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MagicLinkPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signInWithMagicLink(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Masuk Tanpa Password
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Kami akan mengirim link masuk ke email kamu
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {success ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center text-sm text-success">
            Link masuk sudah dikirim ke email kamu. Cek inbox dan klik link untuk masuk.
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <>
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
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-[#C2E959] text-base font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim Magic Link"}
            </button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke halaman masuk
          </Link>
        </>
      )}
    </div>
  );
}
