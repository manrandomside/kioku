"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarImage src={user.avatarUrl} alt={user.displayName ?? "User"} />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {initials}
          </AvatarFallback>
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
