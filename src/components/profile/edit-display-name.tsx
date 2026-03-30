"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

import { updateDisplayName } from "@/app/actions/user-settings";

interface EditDisplayNameProps {
  initialName: string;
}

export function EditDisplayName({ initialName }: EditDisplayNameProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function handleCancel() {
    setName(initialName);
    setEditing(false);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      toast.error("Nama harus 2-50 karakter");
      return;
    }

    if (trimmed === initialName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const result = await updateDisplayName(trimmed);
    setSaving(false);

    if (result.success) {
      toast.success("Nama berhasil diubah");
      setEditing(false);
    } else {
      toast.error(result.error?.message ?? "Gagal mengubah nama");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <h1 className="font-display text-xl font-bold tracking-tight text-white">
          {initialName}
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="text-white/30 transition-colors hover:text-white/70"
          aria-label="Edit nama"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        maxLength={50}
        className="h-8 w-40 rounded-lg border border-white/20 bg-white/10 px-2 text-sm font-bold text-white focus:border-[#C2E959] focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-[#C2E959] transition-colors hover:text-[#C2E959]/80 disabled:opacity-50"
        aria-label="Simpan"
      >
        <Check className="size-4" />
      </button>
      <button
        onClick={handleCancel}
        disabled={saving}
        className="text-white/40 transition-colors hover:text-white/70 disabled:opacity-50"
        aria-label="Batal"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
