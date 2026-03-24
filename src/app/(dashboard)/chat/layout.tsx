export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // data-chat-layout triggers has-[[data-chat-layout]] variants in AppShell
  // to remove padding/max-width and enable full-height chat layout
  return (
    <div data-chat-layout className="h-full">
      {children}
    </div>
  );
}
