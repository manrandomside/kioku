export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6">
      <div className="gradient-mesh pointer-events-none absolute inset-0" />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg backdrop-blur-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
