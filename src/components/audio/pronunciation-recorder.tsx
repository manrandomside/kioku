"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Volume2, X, RotateCcw, ChevronRight, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { calculatePronunciationScore, type PronunciationResult } from "@/lib/audio/pronunciation-scoring";

interface PronunciationTarget {
  id?: string;
  type: "vocabulary" | "kana";
  hiragana: string;
  kanji?: string | null;
  romaji: string;
  meaning: string;
  audioUrl?: string | null;
}

interface PronunciationRecorderProps {
  target: PronunciationTarget;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "bg-success";
  if (score >= 70) return "bg-warning";
  if (score >= 50) return "bg-orange-500";
  return "bg-destructive";
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-warning";
  if (score >= 50) return "text-orange-500";
  return "text-destructive";
}

export function PronunciationRecorder({
  target,
  isOpen,
  onClose,
  onNext,
}: PronunciationRecorderProps) {
  const {
    isSupported,
    isListening,
    transcript,
    error: recognitionError,
    startListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [saving, setSaving] = useState(false);

  function playAudio() {
    if (target.audioUrl) {
      const audio = new Audio(target.audioUrl);
      audio.play().catch(() => {});
    }
  }

  const handleRecord = useCallback(async () => {
    setResult(null);
    await startListening();
  }, [startListening]);

  // Score when transcript arrives
  const scoredTranscriptRef = useRef("");

  useEffect(() => {
    if (!transcript || transcript === scoredTranscriptRef.current) return;
    scoredTranscriptRef.current = transcript;

    const scored = calculatePronunciationScore(target.hiragana, transcript, {
      kanji: target.kanji,
      romaji: target.romaji,
    });
    setResult(scored);

    // Log to server (fire-and-forget)
    setSaving(true);
    fetch("/api/v1/ai/pronunciation/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabulary_id: target.type === "vocabulary" ? target.id : undefined,
        kana_id: target.type === "kana" ? target.id : undefined,
        expected_text: target.hiragana,
        recognized_text: transcript,
        expected_kanji: target.kanji || undefined,
        expected_romaji: target.romaji || undefined,
        accuracy_score: scored.score / 100,
      }),
    })
      .catch(() => {})
      .finally(() => setSaving(false));
  }, [transcript, target]);

  function handleRetry() {
    resetTranscript();
    setResult(null);
    scoredTranscriptRef.current = "";
  }

  function handleNext() {
    resetTranscript();
    setResult(null);
    scoredTranscriptRef.current = "";
    onNext?.();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 mx-4 w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl border border-border/50 bg-card p-5 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Browser not supported */}
            {!isSupported ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
                  <AlertTriangle className="h-7 w-7 text-warning" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Browser Tidak Didukung
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Browser kamu belum mendukung fitur ini. Gunakan Chrome untuk
                    pengalaman terbaik.
                  </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {/* Title */}
                <h3 className="text-xs font-medium text-muted-foreground">
                  Latihan Pengucapan
                </h3>

                {/* Target word */}
                <div className="flex flex-col items-center gap-0.5">
                  {target.kanji && (
                    <span className="font-jp text-sm text-muted-foreground">
                      {target.kanji}
                    </span>
                  )}
                  <span className="font-jp text-4xl font-medium text-foreground">
                    {target.hiragana}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {target.romaji}
                  </span>
                  <span className="text-xs text-primary font-medium">
                    {target.meaning}
                  </span>
                </div>

                {/* Listen + Record row */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={playAudio}
                    disabled={!target.audioUrl}
                  >
                    <Volume2 className="h-4 w-4" />
                    Dengar
                  </Button>

                  <button
                    onClick={handleRecord}
                    disabled={isListening || saving}
                    className={cn(
                      "relative flex h-16 w-16 items-center justify-center rounded-full transition-all",
                      isListening
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90",
                      (isListening || saving) && "cursor-not-allowed"
                    )}
                  >
                    {isListening && (
                      <>
                        <motion.span
                          className="absolute inset-0 rounded-full bg-destructive/30"
                          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.span
                          className="absolute inset-0 rounded-full bg-destructive/20"
                          animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                        />
                      </>
                    )}
                    <Mic className="h-6 w-6 relative z-10" />
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground">
                  {isListening
                    ? "Sedang mendengarkan..."
                    : result
                      ? "Ketuk mikrofon untuk coba lagi"
                      : "Ketuk mikrofon untuk mulai"}
                </span>

                {/* Recognition error */}
                {recognitionError && !result && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-destructive"
                  >
                    {recognitionError}
                  </motion.p>
                )}

                {/* Result */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex w-full flex-col gap-2 rounded-xl border border-border/50 bg-muted/30 p-3"
                    >
                      {/* Recognized text + score inline */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-muted-foreground">
                            Kamu bilang:
                          </span>
                          <p className="font-jp text-lg font-medium text-foreground truncate">
                            {transcript || "-"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Seharusnya: <span className="font-jp">{target.hiragana}</span>
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-2xl font-bold",
                            getScoreTextColor(result.score)
                          )}
                        >
                          {result.score}%
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={cn("h-full rounded-full", getScoreColor(result.score))}
                        />
                      </div>

                      {/* Feedback */}
                      <p className="text-center text-xs font-medium text-foreground">
                        {result.feedback}
                      </p>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={handleRetry}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Coba Lagi
                        </Button>
                        {onNext && (
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={handleNext}
                          >
                            Berikutnya
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
