"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Target } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateDailyGoal } from "@/app/actions/user-settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DAILY_GOAL_TIERS = [
  { value: "100", label: "Santai", xp: "100 XP" },
  { value: "300", label: "Reguler", xp: "300 XP" },
  { value: "500", label: "Serius", xp: "500 XP" },
  { value: "750", label: "Intens", xp: "750 XP" },
  { value: "1000", label: "Intensif", xp: "1000 XP" },
] as const;

function getTier(value: string) {
  return DAILY_GOAL_TIERS.find((t) => t.value === value);
}

interface DailyGoalSettingProps {
  initialGoal: string;
}

export function DailyGoalSetting({ initialGoal }: DailyGoalSettingProps) {
  const [selected, setSelected] = useState(initialGoal);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(value: string) {
    if (value === selected || isPending) return;
    setPendingValue(value);
  }

  function handleConfirm() {
    if (!pendingValue) return;
    const newValue = pendingValue;
    const oldValue = selected;
    const tier = getTier(newValue);
    setSelected(newValue);
    setPendingValue(null);
    startTransition(async () => {
      const result = await updateDailyGoal(newValue);
      if (result.success && tier) {
        toast.success(`Target harian diubah ke ${tier.label}`);
      } else {
        setSelected(oldValue);
        toast.error("Gagal menyimpan target harian");
        console.error("[DailyGoalSetting] updateDailyGoal failed:", result.error);
      }
    });
  }

  function handleCancel() {
    setPendingValue(null);
  }

  const oldTier = getTier(selected);
  const newTier = pendingValue ? getTier(pendingValue) : null;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[#248288]" />
          <div>
            <p className="text-sm font-semibold">Target Harian</p>
            <p className="text-xs text-muted-foreground">
              Jumlah XP yang ingin dicapai setiap hari
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {DAILY_GOAL_TIERS.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => handleSelect(tier.value)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-2.5 text-center transition-all",
                selected === tier.value
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
            >
              <span className="text-xs font-semibold">{tier.label}</span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  selected === tier.value ? "text-accent" : "text-muted-foreground"
                )}
              >
                {tier.xp}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AlertDialog open={!!pendingValue} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <AlertDialogContent className="border-accent/30 p-6">
          <AlertDialogHeader>
            <AlertDialogMedia className="size-12 rounded-full bg-accent/15">
              <Target className="size-6 text-[#248288]" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-xl font-bold text-primary">
              Ubah Target Harian?
            </AlertDialogTitle>
            <AlertDialogDescription render={<div />} className="space-y-3">
                <p>Apakah kamu yakin ingin mengubah target harian?</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/50 px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">Saat ini</span>
                    <span className="text-sm font-bold text-foreground">{oldTier?.label}</span>
                    <span className="text-xs font-medium text-muted-foreground">{oldTier?.xp}</span>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-accent" />
                  <div className="flex flex-col items-center gap-1 rounded-lg border-2 border-accent bg-accent/10 px-4 py-2.5">
                    <span className="text-xs text-accent">Baru</span>
                    <span className="text-sm font-bold text-foreground">{newTier?.label}</span>
                    <span className="text-xs font-medium text-accent">{newTier?.xp}</span>
                  </div>
                </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-accent py-3 font-bold text-[#0A3A3A] hover:bg-accent/90"
            >
              Ya, Ubah Target
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
