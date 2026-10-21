import { describe, it, expect } from "vitest";
import { getSafeRedirect, isJwtExpired } from "@/lib/security";

describe("getSafeRedirect (Open Redirect Defensive Guard)", () => {
  it("allows safe relative paths", () => {
    expect(getSafeRedirect("/products")).toBe("/products");
    expect(getSafeRedirect("/admin/orders?page=2&status=PENDING")).toBe(
      "/admin/orders?page=2&status=PENDING"
    );
    expect(getSafeRedirect("/catalog#featured")).toBe("/catalog#featured");
  });

  it("returns default fallback '/' when url is empty, null, or undefined", () => {
    expect(getSafeRedirect(null)).toBe("/");
    expect(getSafeRedirect(undefined)).toBe("/");
    expect(getSafeRedirect("")).toBe("/");
    expect(getSafeRedirect("   ")).toBe("/");
  });

  it("uses custom fallback when provided", () => {
    expect(getSafeRedirect(null, "/admin")).toBe("/admin");
    expect(getSafeRedirect("https://attacker.com", "/dashboard")).toBe("/dashboard");
  });

  it("blocks external protocol-relative URLs", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/");
    expect(getSafeRedirect("//google.com/test")).toBe("/");
  });

  it("blocks URLs with backslashes to prevent browser normalization bypass", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/");
    expect(getSafeRedirect("/products\\attack")).toBe("/");
  });

  it("blocks absolute URLs pointing to external domains", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/");
    expect(getSafeRedirect("http://evil.com/login")).toBe("/");
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/");
    expect(getSafeRedirect("data:text/html,evil")).toBe("/");
  });
});

describe("isJwtExpired", () => {
  const makeJwt = (payload: object) => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.mock-signature`;
  };

  it("returns false for valid token with future exp", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ sub: "user1", exp: futureExp });
    expect(isJwtExpired(token)).toBe(false);
  });

  it("returns true for token with past exp", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 100;
    const token = makeJwt({ sub: "user1", exp: pastExp });
    expect(isJwtExpired(token)).toBe(true);
  });

  it("returns false for non-JWT or tokens without exp claim (e.g. test mock tokens)", () => {
    expect(isJwtExpired("mock-access-token")).toBe(false);
    expect(isJwtExpired(makeJwt({ sub: "user1" }))).toBe(false);
    expect(isJwtExpired(null)).toBe(false);
    expect(isJwtExpired(undefined)).toBe(false);
  });
});
