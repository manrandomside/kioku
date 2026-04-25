"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { updateAvatar } from "@/app/actions/user-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESET_AVATARS = [
  "\uD83C\uDF8C", "\uD83D\uDDFE", "\u26E9\uFE0F", "\uD83C\uDF38",
  "\uD83C\uDF8B", "\uD83C\uDF63", "\uD83C\uDF71", "\uD83C\uDF8E",
  "\uD83C\uDFEF", "\uD83D\uDDFB", "\uD83D\uDCDA", "\u270F\uFE0F",
  "\uD83C\uDF93", "\uD83D\uDCAE", "\uD83C\uDF19", "\u2B50",
] as const;

function isEmojiAvatar(avatarUrl: string | null): boolean {
  if (!avatarUrl) return false;
  return !avatarUrl.startsWith("http");
}

interface AvatarPickerProps {
  currentAvatar: string | null;
  displayName: string;
}

export function AvatarPicker({ currentAvatar, displayName }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentAvatar);
  const [isPending, startTransition] = useTransition();
  const [savingEmoji, setSavingEmoji] = useState<string | null>(null);

  const currentEmoji = isEmojiAvatar(selected) ? selected : null;
  const initial = displayName.charAt(0).toUpperCase();

  function handleSelect(emoji: string) {
    if (isPending) return;
    const newValue = emoji === currentEmoji ? "" : emoji;
    setSavingEmoji(emoji === currentEmoji ? "" : emoji);
    startTransition(async () => {
      const result = await updateAvatar(newValue);
      setSavingEmoji(null);
      if (result.success) {
        setSelected(result.data?.avatarUrl ?? null);
        setOpen(false);
        toast.success("Avatar berhasil diubah!");
      } else {
        toast.error(result.error?.message ?? "Gagal mengubah avatar");
      }
    });
  }

  function handleSelectInitial() {
    if (isPending || !currentEmoji) return;
    setSavingEmoji("");
    startTransition(async () => {
      const result = await updateAvatar("");
      setSavingEmoji(null);
      if (result.success) {
        setSelected(null);
        setOpen(false);
        toast.success("Avatar berhasil diubah!");
      } else {
        toast.error(result.error?.message ?? "Gagal mengubah avatar");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative cursor-pointer rounded-full"
        aria-label="Ubah avatar"
      >
        {/* Outer gradient ring with rotate animation on hover */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#C2E959] to-[#248288] opacity-80 transition-all group-hover:opacity-100 group-hover:animate-[spin_3s_linear_infinite]" />
        {/* Inner white ring */}
        <div className="absolute -inset-0.5 rounded-full bg-white/20 dark:bg-white/10" />
        {/* Avatar circle */}
        <div className="relative flex size-24 items-center justify-center rounded-full bg-muted sm:size-28">
          {currentEmoji ? (
            <span className="text-5xl leading-none sm:text-6xl">{currentEmoji}</span>
          ) : (
            <span className="text-3xl font-bold text-muted-foreground sm:text-4xl">{initial}</span>
          )}
        </div>
        {/* Edit indicator - always visible */}
        <div className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-[#0A3A3A] bg-[#C2E959] shadow-sm">
          <Pencil className="size-3.5 text-[#0A3A3A]" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Avatar</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
            {PRESET_AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                disabled={isPending}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition-all hover:scale-105 disabled:opacity-50",
                  currentEmoji === emoji
                    ? "border-[#C2E959] bg-[#C2E959]/10"
                    : "border-border hover:border-border/80 hover:bg-muted/50"
                )}
              >
                {isPending && savingEmoji === emoji ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  emoji
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Atau gunakan inisial nama:</p>
            <button
              type="button"
              onClick={handleSelectInitial}
              disabled={isPending || !currentEmoji}
              className={cn(
                "flex size-12 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all hover:scale-105 disabled:opacity-50",
                !currentEmoji
                  ? "border-[#C2E959] bg-[#C2E959]/10"
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
            >
              {isPending && savingEmoji === "" ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                initial
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
