"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, AlertCircle, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { SuggestedPrompts } from "./suggested-prompts";
import { ChatSidebar, type ChatSession } from "./chat-sidebar";

// Extract text content from UIMessage parts
function getMessageText(message: { parts: Array<{ type: string; text?: string }> }): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");
}

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = activeSessionId;

  // Use a stable transport instance with a dynamic body function
  // so that sessionId is always current when a message is sent
  const [transport] = useState(
    () =>
      new TextStreamChatTransport({
        api: "/api/v1/ai/chat",
        body: () => ({ sessionId: sessionIdRef.current }),
      })
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat({
    transport,
    async onFinish() {
      // After AI finishes, refresh sessions and capture the new session ID
      const updatedSessions = await fetchSessions();
      if (!sessionIdRef.current && updatedSessions && updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
      }
    },
    onError() {
      // Error is surfaced via the error state
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Fetch session list and return updated sessions
  const fetchSessions = useCallback(async (): Promise<ChatSession[] | null> => {
    try {
      const res = await fetch("/api/v1/ai/chat/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
        return data.data.sessions;
      }
    } catch {
      // Non-critical
    }
    return null;
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load messages for a session
  async function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) return;

    setLoadingHistory(true);
    setActiveSessionId(sessionId);

    try {
      const res = await fetch(`/api/v1/ai/chat/${sessionId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(
          data.data.messages
            .filter((m: { role: string }) => m.role !== "system")
            .map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              parts: [{ type: "text" as const, text: m.content }],
            }))
        );
      }
    } catch {
      // Keep current messages
    } finally {
      setLoadingHistory(false);
    }
  }

  // Start new chat
  function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();
  }

  // Delete session
  async function handleDeleteSession(sessionId: string) {
    try {
      await fetch(`/api/v1/ai/chat/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch {
      // Silently fail
    }
  }

  // Handle suggested prompt selection
  function handleSuggestedPrompt(prompt: string) {
    setInputValue(prompt);
    inputRef.current?.focus();
  }

  // Submit message
  async function handleSend() {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    await sendMessage({ text });
  }

  // Handle Enter key to submit (Shift+Enter for newline)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }

  const lastMessage = messages[messages.length - 1];
  const isWaitingForResponse = isLoading && lastMessage?.role === "user";
  const isStreamingResponse = status === "streaming" && lastMessage?.role === "assistant";

  return (
    <div className="flex h-full">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            title="Riwayat chat"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                Chat dengan Sensei
              </h1>
              <p className="text-xs text-muted-foreground">
                Tutor bahasa Jepang
              </p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role as "user" | "assistant"}
                    content={getMessageText(message)}
                    isStreaming={
                      isStreamingResponse && message.id === lastMessage?.id
                    }
                  />
                ))}
              </AnimatePresence>

              {/* Typing indicator when waiting for AI response */}
              {isWaitingForResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    S
                  </div>
                  <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-4 flex max-w-3xl items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Gagal menghubungi Sensei. Silakan coba lagi.</span>
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Tanya Sensei..."
                rows={1}
                disabled={isLoading}
                className="w-full resize-none rounded-xl border border-border/50 bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                style={{ maxHeight: "160px" }}
              />
            </div>
            <Button
              type="button"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              onClick={handleSend}
              className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-muted-foreground/60">
            Sensei bisa melakukan kesalahan. Periksa kembali informasi penting.
          </p>
        </div>
      </div>
    </div>
  );
}
