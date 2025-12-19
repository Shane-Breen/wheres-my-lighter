// lib/visitorId.ts
"use client";

/**
 * Stable, anonymous visitor ID stored in localStorage.
 * Used to count unique holders without forcing signup.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";

  const KEY = "wml_visitor_id";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const id = uuidv4();
  window.localStorage.setItem(KEY, id);
  return id;
}

function uuidv4(): string {
  const c: Crypto | undefined = typeof crypto !== "undefined" ? crypto : undefined;

  // Prefer Web Crypto UUID when available (type-safe)
  const maybe = c as (Crypto & { randomUUID?: () => string }) | undefined;
  if (maybe?.randomUUID) return maybe.randomUUID();

  // Fallback to RFC4122 v4 using getRandomValues
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }

  // Last-resort fallback (still stable once stored)
  return `wml_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
