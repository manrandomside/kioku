export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder - will be implemented in P0 basic layout task */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
