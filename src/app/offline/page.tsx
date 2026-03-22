import { WifiOff } from "lucide-react";

import { ReloadButton } from "./reload-button";

export const metadata = {
  title: "Offline - Kioku",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="size-10 text-muted-foreground" />
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Tidak Ada Koneksi
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Kioku membutuhkan koneksi internet untuk sinkronisasi data belajar
          kamu. Periksa koneksi dan coba lagi.
        </p>
      </div>

      <ReloadButton />
    </div>
  );
}
