import React, { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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
