"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          S
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]",
          isUser
            ? "bg-[#C2E959] text-[#0A3A3A] rounded-br-md"
            : "bg-card border border-border/50 text-card-foreground rounded-bl-md"
        )}
      >
        <div className="chat-content whitespace-pre-wrap break-words font-[var(--font-body)]">
          <MessageContent content={content} />
        </div>
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-current opacity-60" />
        )}
      </div>
    </motion.div>
  );
}

// Render simple markdown: bold, italic, inline code
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold font-jp">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        // Detect Japanese text segments and apply JP font
        return <JapaneseText key={i} text={part} />;
      })}
    </>
  );
}

// Apply Noto Sans JP font to Japanese characters
function JapaneseText({ text }: { text: string }) {
  const segments = text.split(/([\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u{20000}-\u{2A6DF}]+)/gu);

  return (
    <>
      {segments.map((segment, i) => {
        const isJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(segment);
        if (isJapanese) {
          return (
            <span key={i} className="font-jp">
              {segment}
            </span>
          );
        }
        return <span key={i}>{segment}</span>;
      })}
    </>
  );
}
