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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-md lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary dark:text-accent"
                  : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 transition-colors",
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
