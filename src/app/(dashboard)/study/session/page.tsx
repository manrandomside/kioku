import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Smart Study" };

export default function StudySessionPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <BookOpen className="size-8 text-primary" />
      </div>
      <h1 className="font-display text-xl font-bold">Smart Study Session</h1>
      <p className="text-center text-sm text-muted-foreground">
        Sesi belajar akan dimuat di sini.
        <br />
        Prompt berikutnya akan membuat halaman ini.
      </p>
    </div>
  );
}
