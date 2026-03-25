"use client";

import { useRef, useState, type ReactNode, type KeyboardEvent } from "react";

interface PathTabsProps {
  labelA: string;
  labelB: string;
  panelA: ReactNode;
  panelB: ReactNode;
}

export function PathTabs({ labelA, labelB, panelA, panelB }: PathTabsProps) {
  const [selectedPath, setSelectedPath] = useState<"A" | "B">("A");
  const tabARef = useRef<HTMLButtonElement>(null);
  const tabBRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, current: "A" | "B") => {
    if (e.key === "ArrowRight" && current === "A") {
      e.preventDefault();
      setSelectedPath("B");
      tabBRef.current?.focus();
    } else if (e.key === "ArrowLeft" && current === "B") {
      e.preventDefault();
      setSelectedPath("A");
      tabARef.current?.focus();
    } else if (e.key === "ArrowLeft" && current === "A") {
      e.preventDefault();
    } else if (e.key === "ArrowRight" && current === "B") {
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Simulation path narrative"
        className="flex gap-2 border-b border-border pb-2"
      >
        <button
          ref={tabARef}
          type="button"
          role="tab"
          id="tab-path-a"
          aria-selected={selectedPath === "A"}
          aria-controls="panel-path-a"
          tabIndex={selectedPath === "A" ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, "A")}
          onClick={() => setSelectedPath("A")}
          className={`rounded-md px-4 py-2 text-body font-medium transition ${
            selectedPath === "A" ? "bg-accent text-bg" : "text-text-dim hover:text-text"
          }`}
        >
          {labelA}
        </button>
        <button
          ref={tabBRef}
          type="button"
          role="tab"
          id="tab-path-b"
          aria-selected={selectedPath === "B"}
          aria-controls="panel-path-b"
          tabIndex={selectedPath === "B" ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, "B")}
          onClick={() => setSelectedPath("B")}
          className={`rounded-md px-4 py-2 text-body font-medium transition ${
            selectedPath === "B"
              ? "bg-blue text-bg"
              : "text-text-dim hover:text-text"
          }`}
        >
          {labelB}
        </button>
      </div>

      <div
        role="tabpanel"
        id="panel-path-a"
        aria-labelledby="tab-path-a"
        hidden={selectedPath !== "A"}
      >
        {panelA}
      </div>
      <div
        role="tabpanel"
        id="panel-path-b"
        aria-labelledby="tab-path-b"
        hidden={selectedPath !== "B"}
      >
        {panelB}
      </div>
    </div>
  );
}
