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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8" style={{ background: "linear-gradient(135deg, #0A3A3A 0%, #062828 100%)" }}>
      {/* Gradient mesh overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse at 30% 20%, rgba(194,233,89,0.08), transparent 50%)",
            "radial-gradient(ellipse at 70% 80%, rgba(166,226,172,0.06), transparent 50%)",
          ].join(", "),
        }}
      />

      {/* Floating kanji decoration */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-jp">
        <span className="absolute left-[6%] top-[10%] text-7xl text-white/[0.04] -rotate-12">{"\u8A18"}</span>
        <span className="absolute right-[8%] top-[15%] text-8xl text-white/[0.04] rotate-6">{"\u61B6"}</span>
        <span className="absolute left-[12%] bottom-[18%] text-6xl text-white/[0.04] rotate-12">{"\u8A9E"}</span>
        <span className="absolute right-[15%] bottom-[12%] text-9xl text-white/[0.03] -rotate-6">{"\u5B66"}</span>
        <span className="absolute left-[45%] top-[65%] text-7xl text-white/[0.03] rotate-3">{"\u65E5"}</span>
        <span className="absolute right-[40%] top-[5%] text-6xl text-white/[0.04] -rotate-9">{"\u672C"}</span>
      </div>

      <div className="relative z-10 w-full max-w-[540px]">
        {children}
      </div>
    </div>
  );
}
