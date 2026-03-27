import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const px = SIZE_MAP[size];

  const style = { height: px, maxHeight: px, width: "auto" } as const;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.svg"
        alt="Kioku"
        style={style}
        className={cn("block dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-white.svg"
        alt="Kioku"
        style={style}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}
