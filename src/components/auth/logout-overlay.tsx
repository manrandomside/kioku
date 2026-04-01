"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

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
        {children || (
          <>
            <LogOut className="size-4" />
            Keluar
          </>
        )}
      </button>

      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A3A3A]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-[#C2E959]/15">
                <LogOut className="size-8 text-[#C2E959]" />
              </div>
              <p className="font-display text-2xl font-bold text-white">
                Sampai jumpa!
              </p>
              <p className="text-sm text-white/60">
                Terus semangat belajar bahasa Jepang
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="size-2 animate-bounce rounded-full bg-[#C2E959]/60 [animation-delay:0ms]" />
                <span className="size-2 animate-bounce rounded-full bg-[#C2E959]/60 [animation-delay:150ms]" />
                <span className="size-2 animate-bounce rounded-full bg-[#C2E959]/60 [animation-delay:300ms]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
