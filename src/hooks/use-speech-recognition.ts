"use client";

import { useCallback, useRef, useState } from "react";

import {
  isSpeechRecognitionSupported,
  startRecognition,
} from "@/lib/audio/speech-recognition";

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" && isSpeechRecognitionSupported();

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setConfidence(0);
    setIsListening(true);
    abortedRef.current = false;

    const result = await startRecognition();

    // If manually stopped while recognition was running, ignore result
    if (abortedRef.current) {
      setIsListening(false);
      return;
    }

    setIsListening(false);

    if (result.success && result.data) {
      setTranscript(result.data.transcript);
      setConfidence(result.data.confidence);
    } else if (result.error) {
      setError(result.error.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    abortedRef.current = true;
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
