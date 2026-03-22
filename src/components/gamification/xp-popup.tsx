"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback } from "react";

interface XpEvent {
  id: number;
  amount: number;
}

let nextId = 0;

export function useXpPopup() {
  const [events, setEvents] = useState<XpEvent[]>([]);

  const showXp = useCallback((amount: number) => {
    if (amount <= 0) return;
    const id = nextId++;
    setEvents((prev) => [...prev, { id, amount }]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }, 1200);
  }, []);

  return { events, showXp };
}

interface XpPopupProps {
  events: XpEvent[];
}

export function XpPopup({ events }: XpPopupProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>
        {events.map((ev, i) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -40 - i * 30, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.6 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute text-lg font-bold text-[#C2E959] drop-shadow-md"
          >
            +{ev.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
