"use client";

import { motion } from "framer-motion";
import { BookOpen, Brain, MessageCircle, Landmark } from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

interface PromptCategory {
  label: string;
  icon: LucideIcon;
  color: string;
  prompts: string[];
}

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    label: "Kosakata",
    icon: BookOpen,
    color: "text-[#C2E959]",
    prompts: [
      "Apa bedanya 食べる dan 飲む?",
      "Kata-kata penting untuk di restoran",
    ],
  },
  {
    label: "Grammar",
    icon: Brain,
    color: "text-[#248288]",
    prompts: [
      "Jelaskan perbedaan は dan が",
      "Cara menggunakan pola ～たいです",
    ],
  },
  {
    label: "Percakapan",
    icon: MessageCircle,
    color: "text-violet-400",
    prompts: [
      "Latihan perkenalan diri",
      "Role-play belanja di konbini",
    ],
  },
  {
    label: "Budaya",
    icon: Landmark,
    color: "text-amber-400",
    prompts: [
      "Kapan pakai さん, ちゃん, くん?",
      "Etika makan di Jepang",
    ],
  },
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-jp text-xl font-bold text-primary-foreground">
          先
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          Halo! Saya Sensei
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tutor bahasa Jepang kamu di Kioku. Pilih topik atau ketik pertanyaanmu!
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {PROMPT_CATEGORIES.map((category, catIdx) => (
          <div key={catIdx} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1">
              <category.icon className={`size-3.5 ${category.color}`} />
              <span className="text-xs font-semibold text-muted-foreground">{category.label}</span>
            </div>
            {category.prompts.map((prompt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (catIdx * 2 + i) * 0.05 }}
                onClick={() => onSelect(prompt)}
                className="rounded-xl border border-border/50 bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary/30 hover:bg-accent/5"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
