import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="gradient-mesh pointer-events-none absolute inset-0" />
      <div className="relative z-10 w-full max-w-[520px]">
        {children}
      </div>
    </div>
  );
}
