"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  RotateCcw,
  HelpCircle,
  MessageCircle,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

interface NavbarProps {
  user: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/learn", label: "Belajar", icon: BookOpen },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <Sheet>
          <SheetTrigger className="inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Link
          href="/home"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          kioku
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary dark:text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
