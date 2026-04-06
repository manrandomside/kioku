"use client";

import { useState, useTransition, useMemo } from "react";
import { Lock, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SecuritySettingProps {
  authProvider: string;
  email: string;
}

export function SecuritySetting({ authProvider, email }: SecuritySettingProps) {
  const isEmailAuth = authProvider === "email";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-[#248288]" />
        <div>
          <p className="text-sm font-semibold">Keamanan</p>
          {isEmailAuth ? (
            <p className="text-xs text-muted-foreground">
              Perbarui password untuk menjaga keamanan akunmu
            </p>
          ) : (
            <div className="mt-1 space-y-1">
              <p className="text-xs text-muted-foreground">
                Kamu login menggunakan akun Google ({email})
              </p>
              <p className="text-xs text-muted-foreground">
                Untuk mengubah password, kelola langsung melalui pengaturan akun Google-mu.
              </p>
            </div>
          )}
        </div>
      </div>

      {isEmailAuth ? (
        <ChangePasswordDialog />
      ) : (
        <a
          href="https://myaccount.google.com/security"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm" className="w-fit gap-1.5">
            Kelola Akun Google
            <ExternalLink className="size-3.5" />
          </Button>
        </a>
      )}
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const requirements = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  }), [newPassword]);

  const allValid =
    requirements.minLength &&
    requirements.hasUppercase &&
    requirements.hasNumber &&
    confirmPassword === newPassword &&
    oldPassword.length > 0 &&
    newPassword.length > 0;

  function resetForm() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) resetForm();
  }

  function handleSubmit() {
    if (!allValid || isPending) return;
    setError("");
    startTransition(async () => {
      try {
        const supabase = createClient();

        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email;
        if (!email) {
          setError("Tidak dapat memverifikasi sesi. Coba logout dan login kembali.");
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: oldPassword,
        });
        if (signInError) {
          setError("Password lama salah");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateError) {
          setError(updateError.message);
          return;
        }

        setOpen(false);
        resetForm();
        toast.success("Password berhasil diubah!");
      } catch {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-fit" />
        }
      >
        Ubah Password
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Password</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Password Lama</Label>
            <PasswordInput
              id="old-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Masukkan password lama"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Masukkan ulang password baru"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-xs text-destructive">Password tidak cocok</p>
            )}
          </div>

          {newPassword.length > 0 && (
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Syarat password:</p>
              <Requirement met={requirements.minLength} label="Minimal 8 karakter" />
              <Requirement met={requirements.hasUppercase} label="Mengandung huruf besar" />
              <Requirement met={requirements.hasNumber} label="Mengandung angka" />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
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
            onClick={handleSubmit}
            disabled={!allValid || isPending}
            className="bg-[#248288] text-white hover:bg-[#248288]/90"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Password"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={met ? "text-green-500" : "text-destructive"}>
        {met ? "\u2705" : "\u274C"}
      </span>
      <span className={met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
