"use client";

import { useState } from "react";

import { JlptUpgradeModal } from "./jlpt-upgrade-modal";

interface JlptUpgradeHandlerProps {
  upgrade: { previousLevel: string; newLevel: string } | null;
}

export function JlptUpgradeHandler({ upgrade }: JlptUpgradeHandlerProps) {
  const [show, setShow] = useState(!!upgrade);

  if (!upgrade || !show) return null;

  return (
    <JlptUpgradeModal
      previousLevel={upgrade.previousLevel}
      newLevel={upgrade.newLevel}
      onDismiss={() => setShow(false)}
    />
  );
}
