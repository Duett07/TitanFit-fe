import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useHydrated } from "@/hooks/useHydrated";

function TestComponent() {
  const isHydrated = useHydrated();
  return React.createElement("div", null, isHydrated ? "hydrated" : "server");
}

describe("useHydrated", () => {
  it("returns false during server-side rendering (SSR snapshot)", () => {
    const html = renderToString(React.createElement(TestComponent));
    expect(html).toContain("server");
    expect(html).not.toContain("hydrated");
  });

  it("exports useHydrated as both named and default export", () => {
    expect(useHydrated).toBeDefined();
    expect(typeof useHydrated).toBe("function");
  });
});
