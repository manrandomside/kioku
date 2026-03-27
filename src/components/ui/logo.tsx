import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-6",
  md: "h-7",
  lg: "h-9",
} as const;

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.svg"
        alt="Kioku"
        className={cn("block w-auto dark:hidden", sizeClass, className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-white.svg"
        alt="Kioku"
        className={cn("hidden w-auto dark:block", sizeClass, className)}
      />
    </>
  );
}
