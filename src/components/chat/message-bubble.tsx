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
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "max-w-[80%] sm:max-w-[70%] lg:max-w-md bg-[#C2E959] text-[#0A3A3A] rounded-br-md"
            : "max-w-[85%] sm:max-w-[75%] lg:max-w-2xl bg-card border border-border/50 text-card-foreground rounded-bl-md"
        )}
      >
        <div className="chat-content break-words font-[var(--font-body)]">
          <MessageContent content={content} />
        </div>
        {isStreaming && (
          <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-current opacity-60" />
        )}
      </div>
    </motion.div>
  );
}

// Render markdown: paragraphs, numbered/bulleted lists, bold, italic, inline code
function MessageContent({ content }: { content: string }) {
  // Split into blocks by double newlines
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, bi) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check if block is a numbered list (lines starting with digit+dot)
        const lines = trimmed.split("\n");
        const isNumberedList = lines.length > 1 && lines.every(
          (l) => /^\d+[.)]\s/.test(l.trim()) || !l.trim()
        );
        const isBulletList = lines.length > 1 && lines.every(
          (l) => /^[-*]\s/.test(l.trim()) || !l.trim()
        );

        if (isNumberedList) {
          return (
            <ol key={bi} className="list-decimal pl-5 flex flex-col gap-1">
              {lines.map((line, li) => {
                const text = line.trim().replace(/^\d+[.)]\s*/, "");
                return text ? (
                  <li key={li}><InlineFormat text={text} /></li>
                ) : null;
              })}
            </ol>
          );
        }

        if (isBulletList) {
          return (
            <ul key={bi} className="list-disc pl-5 flex flex-col gap-1">
              {lines.map((line, li) => {
                const text = line.trim().replace(/^[-*]\s*/, "");
                return text ? (
                  <li key={li}><InlineFormat text={text} /></li>
                ) : null;
              })}
            </ul>
          );
        }

        // Regular paragraph — preserve single line breaks
        return (
          <p key={bi} className="whitespace-pre-line">
            <InlineFormat text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

// Render inline markdown: bold, italic, inline code, Japanese text
function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

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
