import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    email?: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar user={user} />

      <div className="flex flex-1 pt-14">
        <div className="hidden w-56 min-w-[220px] shrink-0 border-r border-border/50 lg:block xl:w-64 xl:min-w-[256px]">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden">
            <Sidebar />
          </div>
        </div>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
