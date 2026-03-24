"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const PROMPTS = [
  "Jelaskan perbedaan は dan が",
  "Bantu saya latihan percakapan di restoran",
  "Apa arti kata 食べる?",
  "Bagaimana cara menghitung benda di Jepang?",
  "Latihan perkenalan diri dalam bahasa Jepang",
  "Jelaskan pola kalimat ～てください",
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center gap-6 px-4 py-12"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
          S
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          Halo! Saya Sensei
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tutor bahasa Jepang kamu. Mau belajar apa hari ini?
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {PROMPTS.map((prompt, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            onClick={() => onSelect(prompt)}
            className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-3 text-left text-sm text-card-foreground transition-colors hover:border-primary/30 hover:bg-accent/5"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#C2E959]" />
            <span>{prompt}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
