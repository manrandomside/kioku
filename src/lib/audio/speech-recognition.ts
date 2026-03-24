// Web Speech API wrapper for Japanese speech recognition

// Type declarations for Web Speech API (not all browsers/TS libs include these)
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultEntry {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultEntry;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onnomatch: (() => void) | null;
  start(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface RecognitionResult {
  transcript: string;
  confidence: number;
}

interface RecognitionError {
  code: string;
  message: string;
}

export interface RecognitionResponse {
  success: boolean;
  data?: RecognitionResult;
  error?: RecognitionError;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWindow(): any {
  if (typeof window === "undefined") return null;
  return window;
}

// Check browser support
export function isSpeechRecognitionSupported(): boolean {
  const w = getWindow();
  if (!w) return false;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Get the SpeechRecognition constructor
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = getWindow();
  if (!w) return null;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const TIMEOUT_MS = 10_000;

export function startRecognition(): Promise<RecognitionResponse> {
  return new Promise((resolve) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      resolve({
        success: false,
        error: {
          code: "NOT_SUPPORTED",
          message: "Browser tidak mendukung Speech Recognition",
        },
      });
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        recognition.abort();
        resolve({
          success: false,
          error: { code: "TIMEOUT", message: "Waktu rekaman habis (10 detik)" },
        });
      }
    }, TIMEOUT_MS);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const result = event.results[0]?.[0];
      if (result) {
        resolve({
          success: true,
          data: {
            transcript: result.transcript,
            confidence: result.confidence,
          },
        });
      } else {
        resolve({
          success: false,
          error: { code: "NO_RESULT", message: "Tidak ada suara yang terdeteksi" },
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const messages: Record<string, string> = {
        "no-speech": "Tidak ada suara yang terdeteksi. Coba bicara lebih keras.",
        "audio-capture": "Mikrofon tidak ditemukan. Pastikan mikrofon terhubung.",
        "not-allowed": "Izin mikrofon ditolak. Aktifkan izin di pengaturan browser.",
        aborted: "Rekaman dibatalkan.",
        network: "Koneksi internet bermasalah.",
      };

      resolve({
        success: false,
        error: {
          code: event.error,
          message: messages[event.error] || "Terjadi kesalahan saat merekam.",
        },
      });
    };

    recognition.onnomatch = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        success: false,
        error: { code: "NO_MATCH", message: "Ucapan tidak dapat dikenali. Coba lagi." },
      });
    };

    recognition.start();
  });
}
