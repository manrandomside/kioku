"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  RotateCcw,
  MessageCircle,
  User,
  Languages,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const SIDEBAR_ITEMS = [
  {
    title: "Menu Utama",
    items: [
      { href: "/home", label: "Home", icon: Home },
      { href: "/learn", label: "Belajar", icon: BookOpen },
      { href: "/review", label: "Review", icon: RotateCcw },
      { href: "/kata-sulit", label: "Kata Sulit", icon: AlertTriangle },
      { href: "/chat", label: "AI Tutor", icon: MessageCircle },
    ],
  },
  {
    title: "Belajar",
    items: [
      { href: "/learn/hirakata", label: "HIRAKATA", icon: Languages },
      { href: "/learn/mnn", label: "Minna no Nihongo", icon: BookOpen },
    ],
  },
  {
    title: "Akun",
    items: [
      { href: "/profile", label: "Profil", icon: User },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [leechBadge, setLeechBadge] = useState(0);

  useEffect(() => {
    fetch("/api/v1/leech/summary")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const total = (json.data.totalLeechCards ?? 0) + (json.data.totalConfusedPairs ?? 0);
          setLeechBadge(total);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside id="tour-sidebar" className="flex h-full flex-col gap-2 overflow-y-auto overflow-x-hidden bg-sidebar p-4 pt-6">
      <Link href="/home" className="mb-4 flex items-center px-2 lg:hidden">
        <Logo size="lg" />
      </Link>

      {SIDEBAR_ITEMS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <span className="px-2 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {section.title}
          </span>
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/kata-sulit" && leechBadge > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                    {leechBadge > 99 ? "99+" : leechBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
