"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, MessageCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(sessionId: string) {
    if (deletingId === sessionId) {
      onDeleteSession(sessionId);
      setDeletingId(null);
    } else {
      setDeletingId(sessionId);
    }
  }

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
                    handleDelete(session.id);
                  }}
                  className={cn(
                    "shrink-0 rounded-md p-1 transition-colors",
                    deletingId === session.id
                      ? "bg-destructive/10 text-destructive"
                      : "text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  )}
                  title={deletingId === session.id ? "Klik lagi untuk menghapus" : "Hapus sesi"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
