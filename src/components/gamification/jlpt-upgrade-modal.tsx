"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

interface JlptUpgradeModalProps {
  previousLevel: string;
  newLevel: string;
  onDismiss: () => void;
}

export function JlptUpgradeModal({ previousLevel, newLevel, onDismiss }: JlptUpgradeModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-sm rounded-2xl border border-[#C2E959]/20 bg-gradient-to-b from-[#0A3A3A] to-[#062828] p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Star decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <motion.div
              initial={{ rotate: 0, scale: 0 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Star className="size-8 fill-[#C2E959] text-[#C2E959]" />
            </motion.div>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-[#C2E959]/15"
          >
            <GraduationCap className="size-10 text-[#C2E959]" />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-2xl font-bold text-white"
          >
            Level JLPT Naik!
          </motion.h2>

          {/* Level transition */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center justify-center gap-4"
          >
            <div className="flex flex-col items-center gap-1 rounded-xl bg-white/10 px-5 py-3">
              <span className="text-xs text-white/60">Sebelumnya</span>
              <span className="text-xl font-bold text-white">{previousLevel}</span>
            </div>
            <ArrowRight className="size-6 text-[#C2E959]" />
            <div className="flex flex-col items-center gap-1 rounded-xl border-2 border-[#C2E959] bg-[#C2E959]/10 px-5 py-3">
              <span className="text-xs text-[#C2E959]">Sekarang</span>
              <span className="text-xl font-bold text-[#C2E959]">{newLevel}</span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-sm text-white/70"
          >
            Selamat! Kamu sudah menguasai semua kosakata JLPT {previousLevel}.
            Sekarang saatnya tantang dirimu dengan materi {newLevel}!
          </motion.p>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6"
          >
            <Button
              onClick={onDismiss}
              className="w-full rounded-full bg-[#C2E959] py-3 font-bold text-[#0A3A3A] hover:bg-[#C2E959]/90"
            >
              Lanjut Belajar!
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
