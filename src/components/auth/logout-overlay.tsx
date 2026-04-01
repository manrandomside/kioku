"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  displayName?: string;
}

export function LogoutButton({
  className,
  children,
  displayName,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setShowOverlay(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    setTimeout(() => {
      setShowOverlay(false);
      setTimeout(() => {
        router.push("/");
      }, 500);
    }, 2500);
  }, [router]);

  useEffect(() => {
    if (!showOverlay) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOverlay]);

  const greeting = displayName
    ? `Sampai Jumpa, ${displayName}!`
    : "Sampai Jumpa!";

  const overlay = (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            width: "100vw",
            height: "100vh",
            background:
              "linear-gradient(135deg, #0A3A3A 0%, #062828 50%, #0F4F4F 100%)",
          }}
        >
          {/* Gradient mesh */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, rgba(194,233,89,0.15), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(166,226,172,0.1), transparent 50%)",
            }}
          />

          {/* Floating kanji decorations */}
          <span className="absolute left-[10%] top-[15%] rotate-[-12deg] select-none font-jp text-7xl font-bold text-white/[0.03]">
            {"\u8A18"}
          </span>
          <span className="absolute right-[15%] top-[25%] rotate-[8deg] select-none font-jp text-8xl font-bold text-white/[0.04]">
            {"\u61B6"}
          </span>
          <span className="absolute left-[20%] bottom-[20%] rotate-[-5deg] select-none font-jp text-9xl font-bold text-white/[0.03]">
            {"\u8A9E"}
          </span>
          <span className="absolute right-[10%] bottom-[30%] rotate-[15deg] select-none font-jp text-6xl font-bold text-white/[0.04]">
            {"\u5B66"}
          </span>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
            <motion.h2
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-display text-3xl font-bold text-white md:text-4xl"
            >
              {greeting}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="font-jp text-xl text-[#C2E959]"
            >
              {"\u307E\u305F\u306D\uFF01"}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-sm text-gray-400"
            >
              Terus semangat belajar bahasa Jepang
            </motion.p>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="mt-2"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        {children}
      </button>

      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}
