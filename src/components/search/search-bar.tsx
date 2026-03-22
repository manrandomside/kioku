"use client";

import { useRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

import { useVocabSearch } from "./use-vocab-search";
import { SearchResults } from "./search-results";

export function SearchBar() {
  const { query, setQuery, results, isLoading, reset } = useVocabSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleClose() {
    setIsOpen(false);
    reset();
  }

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari kosakata..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="h-9 w-56 rounded-lg border border-border/50 bg-muted/50 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 xl:w-72"
        />
        {query && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[420px] overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg">
          <div className="max-h-[400px] overflow-y-auto">
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              onClose={handleClose}
            />
          </div>
          {results.length > 0 && (
            <div className="border-t border-border/30 px-4 py-2 text-center text-xs text-muted-foreground">
              {results.length} hasil ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}
