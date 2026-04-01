"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Hand } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);

    setTimeout(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    }, 1500);
  };

  return (
    <>
      <button onClick={handleLogout} className={className}>
        {children}
      </button>

      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, #0A3A3A 0%, #062828 50%, #0F4F4F 100%)",
            }}
          >
            {/* Gradient mesh overlay */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 20%, rgba(194,233,89,0.15), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(166,226,172,0.1), transparent 50%)",
              }}
            />

            {/* Floating kanji decorations */}
            <span className="absolute left-[10%] top-[15%] rotate-[-12deg] select-none text-7xl font-bold text-white/[0.03]">
              {"\u8A18"}
            </span>
            <span className="absolute right-[15%] top-[25%] rotate-[8deg] select-none text-8xl font-bold text-white/[0.04]">
              {"\u61B6"}
            </span>
            <span className="absolute left-[20%] bottom-[20%] rotate-[-5deg] select-none text-9xl font-bold text-white/[0.03]">
              {"\u8A9E"}
            </span>
            <span className="absolute right-[10%] bottom-[30%] rotate-[15deg] select-none text-6xl font-bold text-white/[0.04]">
              {"\u5B66"}
            </span>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-white.svg"
                alt="Kioku"
                className="h-7 w-auto"
              />

              {/* Animated circle with waving hand */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="flex size-20 items-center justify-center rounded-full bg-[#C2E959]/10 ring-2 ring-[#C2E959]/20"
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 0] }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Hand className="size-10 text-[#C2E959]" />
                </motion.div>
              </motion.div>

              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-3xl font-bold text-white"
                >
                  Sampai Jumpa!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 text-base text-white/50"
                >
                  Terus semangat belajar bahasa Jepang
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-1 text-sm text-white/30"
                >
                  {"\u307E\u305F\u306D\uFF01"}
                </motion.p>
              </div>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2"
              >
                <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-full w-1/2 rounded-full bg-[#C2E959]/60"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
