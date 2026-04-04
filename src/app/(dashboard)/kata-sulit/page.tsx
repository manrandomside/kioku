"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Volume2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useDisplayMode } from "@/hooks/use-display-mode";
import { DisplayModeToggle } from "@/components/ui/display-mode-toggle";
import { playAudio } from "@/lib/audio/play-audio";

import type { LeechCard, ConfusedPair } from "@/lib/services/leech-service";

type TabKey = "leech" | "confused";

export default function KataSulitPage() {
  const { effectiveMode, toggleLocal } = useDisplayMode();
  const [activeTab, setActiveTab] = useState<TabKey>("leech");
  const [leechCards, setLeechCards] = useState<LeechCard[]>([]);
  const [confusedPairs, setConfusedPairs] = useState<ConfusedPair[]>([]);
  const [loadingLeech, setLoadingLeech] = useState(true);
  const [loadingConfused, setLoadingConfused] = useState(true);
  const [errorLeech, setErrorLeech] = useState<string | null>(null);
  const [errorConfused, setErrorConfused] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/leech/cards")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLeechCards(json.data);
        else setErrorLeech(json.error?.message ?? "Gagal memuat data");
      })
      .catch(() => setErrorLeech("Gagal memuat data"))
      .finally(() => setLoadingLeech(false));

    fetch("/api/v1/leech/confused-pairs")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setConfusedPairs(json.data);
        else setErrorConfused(json.error?.message ?? "Gagal memuat data");
      })
      .catch(() => setErrorConfused("Gagal memuat data"))
      .finally(() => setLoadingConfused(false));
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <AlertTriangle className="size-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Kata Sulit
              </h1>
            </div>
          </div>
          <DisplayModeToggle mode={effectiveMode} onToggle={toggleLocal} />
        </div>
        <p className="text-sm text-muted-foreground">
          Kata-kata yang sering kamu lupa. Latihan khusus akan membantumu mengingatnya lebih baik.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-border/50 bg-muted/30 p-1">
        <TabButton
          active={activeTab === "leech"}
          onClick={() => setActiveTab("leech")}
          label="Sering Lupa"
          count={loadingLeech ? undefined : leechCards.length}
        />
        <TabButton
          active={activeTab === "confused"}
          onClick={() => setActiveTab("confused")}
          label="Sering Tertukar"
          count={loadingConfused ? undefined : confusedPairs.length}
          suffix="pasang"
        />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "leech" ? (
          <motion.div
            key="leech"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <LeechTab
              cards={leechCards}
              loading={loadingLeech}
              error={errorLeech}
            />
          </motion.div>
        ) : (
          <motion.div
            key="confused"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ConfusedTab
              pairs={confusedPairs}
              loading={loadingConfused}
              error={errorConfused}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  suffix,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  suffix?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
            active
              ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {count}
          {suffix ? ` ${suffix}` : ""}
        </span>
      )}
    </button>
  );
}

// Leech Cards Tab
function LeechTab({
  cards,
  loading,
  error,
}: {
  cards: LeechCard[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <LeechSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (cards.length === 0) return <LeechEmptyState />;

  return (
    <div className="flex flex-col gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.srsCardId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <LeechCardItem card={card} />
        </motion.div>
      ))}

      {/* Bulk action button */}
      <div className="mt-2">
        <Link
          href="/kata-sulit/latihan"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C2E959] text-base font-bold text-[#0A3A3A] transition-colors hover:bg-[#C2E959]/80"
        >
          Latih Semua Kata Sulit
          <ArrowRight className="size-5" />
        </Link>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Flashcard intensif + quiz recall khusus kata sulit
        </p>
      </div>
    </div>
  );
}

function LeechCardItem({ card }: { card: LeechCard }) {
  const { effectiveMode } = useDisplayMode();
  const isKanaMode = effectiveMode === "kana";
  const isSevere = card.lapses >= 6;

  const handlePlayAudio = useCallback(() => {
    playAudio(card.audioUrl);
  }, [card.audioUrl]);

  const relativeTime = getRelativeTime(card.lastReview);

  const statusLabel: Record<string, string> = {
    new: "Baru",
    learning: "Sedang Dipelajari",
    review: "Review",
    relearning: "Pelajari Ulang",
  };

  const statusColor: Record<string, string> = {
    new: "text-gray-400",
    learning: "text-yellow-500",
    review: "text-green-500",
    relearning: "text-orange-500",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-yellow-500/30">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Severity indicator */}
          <div
            className={cn(
              "mt-0.5 size-2.5 shrink-0 rounded-full",
              isSevere ? "bg-red-500" : "bg-yellow-500"
            )}
          />
          {/* Word display */}
          <div className="min-w-0">
            {card.kanji ? (
              <div className="flex flex-col">
                <span className="font-jp text-[11px] leading-tight text-muted-foreground">
                  {isKanaMode ? card.kanji : card.hiragana}
                </span>
                <span className="font-jp text-xl font-bold leading-tight sm:text-2xl">
                  {isKanaMode ? card.hiragana : card.kanji}
                </span>
              </div>
            ) : (
              <span className="font-jp text-xl font-bold sm:text-2xl">
                {card.hiragana}
              </span>
            )}
            <p className="mt-0.5 text-sm text-muted-foreground">{card.meaningId}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isSevere
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            )}
          >
            Lupa {card.lapses}x
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Bab {card.chapterNumber}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {relativeTime && (
          <span>Terakhir review: {relativeTime}</span>
        )}
        <span className={statusColor[card.status] ?? "text-muted-foreground"}>
          {statusLabel[card.status] ?? card.status}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2">
        {card.audioUrl && (
          <button
            type="button"
            onClick={handlePlayAudio}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#248288]/10 px-3 text-xs font-medium text-[#248288] transition-colors hover:bg-[#248288]/20"
          >
            <Volume2 className="size-3.5" />
            Dengar
          </button>
        )}
        <Link
          href={`/kata-sulit/latihan?vocab=${card.vocabularyId}`}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Latih Kata Ini
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function LeechEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle2 className="size-10 text-green-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold">Tidak ada kata sulit!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Terus pertahankan! Kamu mengingat semua kata dengan baik.
        </p>
      </div>
    </div>
  );
}

function LeechSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2.5 rounded-full bg-muted" />
              <div>
                <div className="h-3 w-10 rounded bg-muted" />
                <div className="mt-1.5 h-7 w-24 rounded bg-muted" />
                <div className="mt-1.5 h-4 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-12 rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-20 rounded-lg bg-muted" />
            <div className="h-8 w-28 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Confused Pairs Tab
function ConfusedTab({
  pairs,
  loading,
  error,
}: {
  pairs: ConfusedPair[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <ConfusedSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (pairs.length === 0) return <ConfusedEmptyState />;

  return (
    <div className="flex flex-col gap-3">
      {pairs.map((pair, i) => (
        <motion.div
          key={`${pair.wordA.vocabularyId}-${pair.wordB.vocabularyId}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ConfusedPairCard pair={pair} index={i + 1} />
        </motion.div>
      ))}
    </div>
  );
}

function ConfusedPairCard({
  pair,
  index,
}: {
  pair: ConfusedPair;
  index: number;
}) {
  const { effectiveMode } = useDisplayMode();
  const isKanaMode = effectiveMode === "kana";

  function renderWord(word: ConfusedPair["wordA"]) {
    return (
      <div className="flex flex-col">
        {word.kanji ? (
          <>
            <span className="font-jp text-[11px] leading-tight text-muted-foreground">
              {isKanaMode ? word.kanji : word.hiragana}
            </span>
            <span className="font-jp text-lg font-bold leading-tight sm:text-xl">
              {isKanaMode ? word.hiragana : word.kanji}
            </span>
          </>
        ) : (
          <span className="font-jp text-lg font-bold sm:text-xl">
            {word.hiragana}
          </span>
        )}
        <span className="mt-0.5 text-sm text-muted-foreground">
          {word.meaningId}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-purple-500/30">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          Pasangan #{index}
        </span>
        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
          Tertukar {pair.confusionCount}x
        </span>
      </div>

      {/* Word A */}
      <div className="flex items-center gap-3">
        {renderWord(pair.wordA)}
      </div>

      {/* VS separator */}
      <div className="my-2.5 flex items-center gap-2">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-bold text-muted-foreground/60">vs</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      {/* Word B */}
      <div className="flex items-center gap-3">
        {renderWord(pair.wordB)}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2">
        {pair.wordA.audioUrl && (
          <button
            type="button"
            onClick={() => playAudio(pair.wordA.audioUrl)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#248288]/10 px-3 text-xs font-medium text-[#248288] transition-colors hover:bg-[#248288]/20"
          >
            <Volume2 className="size-3.5" />A
          </button>
        )}
        {pair.wordB.audioUrl && (
          <button
            type="button"
            onClick={() => playAudio(pair.wordB.audioUrl)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#248288]/10 px-3 text-xs font-medium text-[#248288] transition-colors hover:bg-[#248288]/20"
          >
            <Volume2 className="size-3.5" />B
          </button>
        )}
        <button
          type="button"
          disabled
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary/50 cursor-not-allowed"
          title="Segera hadir"
        >
          Quiz Pasangan Ini
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ConfusedEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle2 className="size-10 text-green-500" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold">Belum ada kata yang sering tertukar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Terus berlatih! Data ini akan terisi seiring kamu mengerjakan quiz.
        </p>
      </div>
    </div>
  );
}

function ConfusedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border/50 bg-card p-4"
        >
          <div className="mb-3 flex justify-between">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="mt-1 h-6 w-28 rounded bg-muted" />
          <div className="mt-1 h-4 w-20 rounded bg-muted" />
          <div className="my-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-muted" />
            <div className="h-4 w-6 rounded bg-muted" />
            <div className="h-px flex-1 bg-muted" />
          </div>
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="mt-1 h-6 w-28 rounded bg-muted" />
          <div className="mt-1 h-4 w-20 rounded bg-muted" />
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-14 rounded-lg bg-muted" />
            <div className="h-8 w-14 rounded-lg bg-muted" />
            <div className="h-8 w-32 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Relative time helper
function getRelativeTime(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "kemarin";
  if (diffDays < 30) return `${diffDays} hari lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}
