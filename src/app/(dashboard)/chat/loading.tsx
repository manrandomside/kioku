import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0" data-chat-layout>
      {/* Sidebar */}
      <div className="hidden w-64 shrink-0 border-r border-border/50 p-4 md:block">
        <Skeleton className="mb-4 h-9 w-full rounded-lg" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 p-4">
          {/* Message bubbles */}
          <div className="flex justify-end">
            <Skeleton className="h-16 w-3/5 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-4/5 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-2/5 rounded-2xl" />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-border/50 p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
