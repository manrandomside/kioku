"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface ChatSession {
  id: string;
  title: string | null;
  messageCount: number;
  updatedAt: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <h3 className="text-sm font-semibold text-foreground">Riwayat Chat</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onNewChat} title="Percakapan baru">
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            title="Tutup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            Belum ada percakapan
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer",
                  activeSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                )}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">
                  {session.title || "Percakapan baru"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDeleteId(session.id);
                  }}
                  className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
                  title="Hapus sesi"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Percakapan?</AlertDialogTitle>
            <AlertDialogDescription>
              Percakapan ini akan dihapus secara permanen dan tidak bisa dikembalikan. Semua riwayat pesan di dalamnya akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  onDeleteSession(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-border/50 bg-sidebar lg:block">
        {sidebarContent}
      </div>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-xl lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
