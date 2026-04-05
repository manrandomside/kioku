"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteUserAccount } from "@/app/actions/account";

interface DangerZoneProps {
  stats: {
    wordsLearned: number;
    quizSessions: number;
    achievementsUnlocked: number;
    currentStreak: number;
    chatSessions: number;
  };
}

export function DangerZone({ stats }: DangerZoneProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmed = confirmText === "HAPUS AKUN";

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    setOpen(next);
    if (!next) setConfirmText("");
  }

  function handleDelete() {
    if (!isConfirmed || isPending) return;
    startTransition(async () => {
      const result = await deleteUserAccount(confirmText);
      if (result.success) {
        setOpen(false);
        toast.success("Akunmu telah dihapus. Terima kasih telah menggunakan Kioku.");
        router.push("/");
      } else {
        toast.error(result.error?.message ?? "Gagal menghapus akun. Silakan coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-red-500" />
        <div>
          <p className="text-sm font-semibold">Zona Bahaya</p>
          <p className="text-xs text-muted-foreground">
            Menghapus akun akan menghapus semua data belajar, progres, dan riwayat secara permanen.
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="w-fit border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
            />
          }
        >
          Hapus Akun
        </DialogTrigger>

        <DialogContent className="border-red-500/30 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <DialogTitle className="text-red-500">Hapus Akun Permanen</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Kamu akan kehilangan:</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">&#x2022;</span>
                  <span>Seluruh progres belajar ({stats.wordsLearned.toLocaleString("id-ID")} kata dikuasai)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">&#x2022;</span>
                  <span>{stats.quizSessions} sesi quiz dan riwayat jawaban</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">&#x2022;</span>
                  <span>{stats.achievementsUnlocked} achievement yang sudah terbuka</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">&#x2022;</span>
                  <span>Streak {stats.currentStreak} hari dan statistik belajar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">&#x2022;</span>
                  <span>{stats.chatSessions} sesi chat AI Tutor</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-red-500/10 px-3 py-2">
              <p className="text-xs font-bold text-red-500">
                Tindakan ini TIDAK DAPAT dibatalkan.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Untuk konfirmasi, ketik <span className="font-bold text-foreground">HAPUS AKUN</span> di bawah:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Ketik HAPUS AKUN"
                autoComplete="off"
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!isConfirmed || isPending}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Permanen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
