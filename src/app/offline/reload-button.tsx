"use client";

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="rounded-lg bg-[#248288] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#248288]/80"
    >
      Coba Lagi
    </button>
  );
}
