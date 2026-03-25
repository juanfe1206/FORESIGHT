"use client";

import { useCallback, useState } from "react";
import { ThinSliceDemo } from "./ThinSliceDemo";
import { LandingHero } from "./LandingHero";

export function AppShell() {
  const [view, setView] = useState<"landing" | "app">("landing");

  const enterApp = useCallback(() => setView("app"), []);
  const backToLanding = useCallback(() => setView("landing"), []);

  if (view === "app") {
    return <ThinSliceDemo onLogoClick={backToLanding} />;
  }

  return <LandingHero onEnter={enterApp} />;
}
