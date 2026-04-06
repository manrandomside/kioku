"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { AlertTriangle, OctagonX, Loader2 } from "lucide-react";
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
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [confirmText, setConfirmText] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmed = confirmText === "HAPUS AKUN";

  // Start countdown when user types correctly in step 2
  useEffect(() => {
    if (step === 2 && isConfirmed && !countdownActive) {
      setCountdownActive(true);
      setCountdown(5);
    }
  }, [step, isConfirmed, countdownActive]);

  // Countdown timer
  useEffect(() => {
    if (!countdownActive || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdownActive, countdown]);

  const canDelete = isConfirmed && countdown <= 0;

  const resetAll = useCallback(() => {
    setStep(0);
    setConfirmText("");
    setCountdown(5);
    setCountdownActive(false);
  }, []);

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) resetAll();
    else setStep(1);
  }

  function handleDelete() {
    if (!canDelete || isPending) return;
    startTransition(async () => {
      const result = await deleteUserAccount(confirmText);
      if (result.success) {
        resetAll();
        toast.success("Akunmu telah dihapus. Terima kasih telah menggunakan Kioku.");
        router.push("/");
      } else {
        toast.error(result.error?.message ?? "Gagal menghapus akun. Silakan coba lagi.");
      }
    });
  }

  const dataItems = [
    `${stats.wordsLearned.toLocaleString("id-ID")} kata yang sudah dikuasai`,
    `${stats.quizSessions} sesi quiz dan seluruh riwayat jawaban`,
    `${stats.achievementsUnlocked} achievement yang sudah terbuka`,
    `Streak ${stats.currentStreak} hari dan seluruh statistik belajar`,
    `${stats.chatSessions} percakapan dengan AI Tutor`,
  ];

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

      <Button
        variant="outline"
        size="sm"
        className="w-fit border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
        onClick={() => handleOpenChange(true)}
      >
        Hapus Akun
      </Button>

      {/* Step 1: Warning */}
      <Dialog open={step === 1} onOpenChange={handleOpenChange}>
        <DialogContent className="border-red-500/30 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <DialogTitle className="text-red-500">Apakah kamu yakin?</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">
              Menghapus akun akan menghapus SEMUA data berikut secara PERMANEN:
            </p>

            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {dataItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 shrink-0 text-xs">&#x2022;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-lg bg-red-500/10 px-3 py-2">
              <p className="text-xs font-bold text-red-500">
                Tindakan ini TIDAK DAPAT dibatalkan.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => resetAll()}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setStep(2);
                setConfirmText("");
                setCountdown(5);
                setCountdownActive(false);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Saya Yakin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Final confirmation with timer */}
      <Dialog open={step === 2} onOpenChange={handleOpenChange}>
        <DialogContent className="border-red-500/30 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <OctagonX className="size-5 text-red-500" />
              <DialogTitle className="text-red-500">Konfirmasi Penghapusan Akun</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Untuk mengkonfirmasi, ketik <span className="font-bold text-foreground">HAPUS AKUN</span> di bawah:
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
              onClick={() => resetAll()}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menghapus...
                </>
              ) : !isConfirmed ? (
                "Hapus Akun Saya"
              ) : countdown > 0 ? (
                `Hapus Akun Saya (${countdown})`
              ) : (
                "Hapus Akun Saya"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
