"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  RotateCcw,
  Search,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/learn", label: "Belajar", icon: BookOpen },
  { href: "/search", label: "Cari", icon: Search },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[3rem] flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors sm:text-xs",
                isActive
                  ? "text-primary dark:text-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 shrink-0 transition-colors",
                  isActive && "text-primary dark:text-accent"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
