import React, { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const memory: Storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal("localStorage", memory);
}

/* Node / jsdom can expose a partial Storage; tests that call `vi.unstubAllGlobals()` need a fresh stub each run. */
installMemoryLocalStorage();
beforeEach(() => {
  if (typeof globalThis.localStorage?.setItem !== "function") {
    installMemoryLocalStorage();
  }
  globalThis.localStorage.clear();
});

/* jsdom: SVGGeometryElement path sampling (used by FlowView particles). */
if (typeof SVGPathElement !== "undefined") {
  if (!SVGPathElement.prototype.getTotalLength) {
    SVGPathElement.prototype.getTotalLength = function getTotalLength() {
      return 320;
    };
  }
  if (!SVGPathElement.prototype.getPointAtLength) {
    SVGPathElement.prototype.getPointAtLength = function getPointAtLength(distance: number) {
      const t = (distance % 320) / 320;
      return new DOMPoint(60 + t * 200, 64 + t * 198);
    };
  }
}

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: function mockDynamic<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    opts?: { ssr?: boolean; loading?: () => ReactNode },
  ) {
    const Lazy = lazy(importFn);
    const fallback = opts?.loading?.() ?? null;
    function DynamicComponent(props: P) {
      return React.createElement(Suspense, { fallback }, React.createElement(Lazy, props));
    }
    return DynamicComponent;
  },
}));

vi.mock("react-map-gl/mapbox", () => ({
  __esModule: true,
  default: function MockMap({
    children,
    onIdle,
  }: {
    children?: React.ReactNode;
    onIdle?: () => void;
  }) {
    useEffect(() => {
      onIdle?.();
    }, [onIdle]);
    return React.createElement("div", { "data-testid": "mock-map" }, children);
  },
  Marker: (props: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "mock-marker" }, props.children),
  Source: (props: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "mock-source" }, props.children),
  Layer: () => null,
}));
