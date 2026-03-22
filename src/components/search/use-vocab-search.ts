import { useState, useEffect, useRef } from "react";

import type { VocabularySearchResult } from "@/types/vocabulary";

const DEBOUNCE_MS = 300;

export function useVocabSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VocabularySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/v1/vocabulary/search?q=${encodeURIComponent(trimmed)}&limit=20`,
          { signal: controller.signal }
        );
        const json = await res.json();

        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("[useVocabSearch]", err);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [query]);

  function reset() {
    setQuery("");
    setResults([]);
    setIsLoading(false);
  }

  return { query, setQuery, results, isLoading, reset };
}
