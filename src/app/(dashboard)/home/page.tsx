import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.display_name ??
    user?.user_metadata?.full_name ??
    "Pelajar";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Selamat datang, {displayName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ayo lanjutkan belajar bahasa Jepang hari ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Total XP</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Streak</p>
          <p className="mt-1 text-2xl font-bold">0 hari</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Kata Dipelajari</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="font-display text-lg font-bold">Mulai Belajar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih modul untuk memulai perjalanan belajar bahasa Jepang kamu.
        </p>
      </div>
    </div>
  );
}
