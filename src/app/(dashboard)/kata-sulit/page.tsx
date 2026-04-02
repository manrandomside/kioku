import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Kata Sulit" };

export default function KataSulitPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-yellow-500/10">
        <AlertTriangle className="size-8 text-yellow-500" />
      </div>
      <h1 className="font-display text-xl font-bold">Kata Sulit</h1>
      <p className="text-center text-sm text-muted-foreground">
        Segera hadir
      </p>
    </div>
  );
}
