"use client";

import { LogOut, User, BookOpen, Map } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTourStore } from "@/stores/tour-store";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/auth/logout-overlay";

interface UserMenuProps {
  user: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const initials = (user.displayName ?? user.email ?? "?")
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const isEmoji = user.avatarUrl && !user.avatarUrl.startsWith("http");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          {isEmoji ? (
            <AvatarFallback className="bg-primary text-base text-primary-foreground">
              {user.avatarUrl}
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.displayName ?? "Pengguna"}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/profile" />}
        >
          <User className="mr-2 size-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href="/guidebook/kioku-guidebook.pdf" target="_blank" rel="noopener noreferrer" />}
        >
          <BookOpen className="mr-2 size-4" />
          Panduan Penggunaan
        </DropdownMenuItem>
        <TourMenuItem />
        <DropdownMenuSeparator />
        <LogoutButton
          displayName={user.displayName}
          className="relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none text-destructive focus:bg-destructive/10 hover:bg-destructive/10 data-disabled:pointer-events-none data-disabled:opacity-50"
        >
          <LogOut className="mr-2 size-4" />
          Keluar
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TourMenuItem() {
  const startTour = useTourStore((s) => s.startTour);
  const router = useRouter();

  function handleClick() {
    // Navigate to dashboard first if not already there
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/home")) {
      router.push("/home");
      // Delay tour start to allow page transition
      setTimeout(() => startTour(), 800);
    } else {
      startTour();
    }
  }

  return (
    <DropdownMenuItem onClick={handleClick}>
      <Map className="mr-2 size-4" />
      Lihat Tour Lagi
    </DropdownMenuItem>
  );
}
