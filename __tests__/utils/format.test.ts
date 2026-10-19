import { describe, it, expect } from "vitest";
import { formatVND } from "@/lib/format";

describe("formatVND", () => {
  it("formats positive numbers with Vietnamese Dong currency symbol", () => {
    const formatted = formatVND(1850000);
    // Remove non-breaking spaces if any
    const normalized = formatted.replace(/\u00A0/g, " ");
    expect(normalized).toBe("1.850.000 ₫");
  });

  it("formats 0 correctly", () => {
    const formatted = formatVND(0);
    const normalized = formatted.replace(/\u00A0/g, " ");
    expect(normalized).toBe("0 ₫");
  });

  it("formats small amounts correctly", () => {
    const formatted = formatVND(50000);
    const normalized = formatted.replace(/\u00A0/g, " ");
    expect(normalized).toBe("50.000 ₫");
  });

  it("handles negative amounts consistently", () => {
    const formatted = formatVND(-10000);
    const normalized = formatted.replace(/\u00A0/g, " ");
    expect(normalized).toContain("10.000 ₫");
    expect(normalized).toContain("-");
  });
});
