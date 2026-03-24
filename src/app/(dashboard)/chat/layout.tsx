export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the default dashboard padding/max-width for full-height chat
  return (
    <div className="-mx-4 -my-4 sm:-my-6 lg:-mx-8 lg:-my-8">
      {children}
    </div>
  );
}
