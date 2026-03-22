"use client";

import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

import { useVocabSearch } from "@/components/search/use-vocab-search";
import { SearchResults } from "@/components/search/search-results";

export default function SearchPage() {
  const { query, setQuery, results, isLoading, reset } = useVocabSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Cari Kosakata
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cari berdasarkan hiragana, kanji, romaji, atau arti
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Ketik untuk mencari..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-border/50 bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        {query && (
          <button
            type="button"
            onClick={reset}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <SearchResults
          results={results}
          query={query}
          isLoading={isLoading}
        />
        {results.length > 0 && (
          <div className="border-t border-border/30 px-4 py-2 text-center text-xs text-muted-foreground">
            {results.length} hasil ditemukan
          </div>
        )}
      </div>
    </div>
  );
}
