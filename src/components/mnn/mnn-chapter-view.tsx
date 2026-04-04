"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, Trophy, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChapterCard } from "@/components/mnn/chapter-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { BookWithChapters } from "@/types/vocabulary";

interface MnnChapterViewProps {
  books: BookWithChapters[];
  jlptTarget: string;
}

export function MnnChapterView({ books, jlptTarget }: MnnChapterViewProps) {
  // Default tab: N5 = Buku 1 (index 0), N4 = Buku 2 (index 1)
  const defaultIndex = jlptTarget === "N4" && books.length > 1 ? 1 : 0;
  const [activeBookIndex, setActiveBookIndex] = useState(defaultIndex);
  const [showN4Warning, setShowN4Warning] = useState(false);
  const n4WarningShownRef = useRef(false);
  const activeBook = books[activeBookIndex];

  const stats = useMemo(() => {
    if (!activeBook) return { total: 0, started: 0, completed: 0, totalVocab: 0, totalMastered: 0 };
    const chapters = activeBook.chapters;
    return {
      total: chapters.length,
      started: chapters.filter((c) => c.vocabMastered > 0).length,
      completed: chapters.filter((c) => c.vocabMastered >= c.vocabCount && c.vocabCount > 0).length,
      totalVocab: chapters.reduce((sum, c) => sum + c.vocabCount, 0),
      totalMastered: chapters.reduce((sum, c) => sum + c.vocabMastered, 0),
    };
  }, [activeBook]);

  // Buku 1 (N5) completion stats for dialog and banner
  const book1Stats = useMemo(() => {
    const book1 = books.find((b) => b.slug === "mnn-1");
    if (!book1) return { completed: 0, total: 0, allCompleted: false };
    const completed = book1.chapters.filter(
      (c) => c.vocabMastered >= c.vocabCount && c.vocabCount > 0
    ).length;
    return {
      completed,
      total: book1.chapters.length,
      allCompleted: completed >= book1.chapters.length && book1.chapters.length > 0,
    };
  }, [books]);

  function handleBookToggle(idx: number) {
    // Check if N5 user is clicking N4 tab (Buku 2 = index 1)
    const isN4Tab = books[idx]?.slug === "mnn-2";
    if (jlptTarget === "N5" && isN4Tab && !n4WarningShownRef.current && !book1Stats.allCompleted) {
      setShowN4Warning(true);
      return;
    }
    setActiveBookIndex(idx);
  }

  function handleProceedToN4() {
    n4WarningShownRef.current = true;
    setShowN4Warning(false);
    const n4Index = books.findIndex((b) => b.slug === "mnn-2");
    if (n4Index >= 0) setActiveBookIndex(n4Index);
  }

  function handleStayN5() {
    n4WarningShownRef.current = true;
    setShowN4Warning(false);
  }

  function switchToBook2() {
    const n4Index = books.findIndex((b) => b.slug === "mnn-2");
    if (n4Index >= 0) {
      n4WarningShownRef.current = true;
      setActiveBookIndex(n4Index);
    }
  }

  if (books.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Belum ada buku tersedia.</p>
      </div>
    );
  }

  const isBook1Active = activeBook?.slug === "mnn-1";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Minna no Nihongo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Belajar kosakata dari buku Minna no Nihongo
        </p>
      </div>

      {/* Book Toggle */}
      <div className="inline-flex h-9 w-full rounded-lg bg-muted p-0.5 sm:w-auto">
        {books.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => handleBookToggle(idx)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all sm:flex-initial",
              activeBookIndex === idx
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {b.slug === "mnn-1" ? "Buku 1 (N5)" : "Buku 2 (N4)"}
          </button>
        ))}
      </div>

      {/* N5 Completed Banner — only on Buku 1 tab */}
      {isBook1Active && book1Stats.allCompleted && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#248288] to-[#C2E959] p-5">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Trophy className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Level N5 Selesai!</h3>
                <p className="mt-1 text-sm text-white/80">
                  Selamat! Kamu sudah menguasai semua kosakata JLPT N5. Siap naik ke level N4?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
              <button
                onClick={switchToBook2}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A3A3A] transition-colors hover:bg-white/90"
              >
                Mulai Belajar N4
                <ArrowRight className="size-4" />
              </button>
              <Link
                href="/profile"
                className="text-center text-xs font-medium text-white/70 hover:text-white/90"
              >
                Ubah Target di Profil
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatItem label="Bab Dikuasai" value={stats.completed} suffix={`/${stats.total}`} />
        <StatItem label="Kata Dikuasai" value={stats.totalMastered} suffix={`/${stats.totalVocab}`} />
        <StatItem label="Dimulai" value={stats.started} />
        <StatItem label="Total Bab" value={stats.total} />
      </div>

      {/* Overall progress bar */}
      {stats.totalVocab > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progres Keseluruhan</span>
            <span className="font-medium">
              {stats.completed}/{stats.total} bab dikuasai · {stats.totalMastered}/{stats.totalVocab} kata dikuasai
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {stats.totalMastered > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(stats.totalMastered / stats.totalVocab) * 100}%` }}
              />
            )}
          </div>
          <p className="text-xs italic text-muted-foreground/70">
            Progres bertambah dengan menjawab benar di Quiz setiap bab
          </p>
        </div>
      )}

      {/* Chapter grid */}
      {activeBook && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
          {activeBook.chapters.map((ch) => (
            <ChapterCard key={ch.id} chapter={ch} />
          ))}
        </div>
      )}

      {/* N4 Warning Dialog */}
      <AlertDialog open={showN4Warning} onOpenChange={setShowN4Warning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-yellow-500/15">
              <AlertTriangle className="size-6 text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-center">
              Yakin ingin membuka materi N4?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Kamu masih memiliki bab yang belum selesai di level N5 (Buku 1).
              Sebaiknya selesaikan N5 dulu agar fondasi bahasamu kuat.
            </AlertDialogDescription>
            <p className="text-center text-sm font-medium text-muted-foreground">
              Progres N5: {book1Stats.completed}/{book1Stats.total} bab selesai
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel onClick={handleStayN5}>
              Kembali ke N5
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedToN4}>
              Tetap Lanjut ke N4
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatItem({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3">
      <span className="text-xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
