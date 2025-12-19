// lib/visitorId.ts
"use client";

/**
 * Generates a stable anonymous visitor id stored in localStorage.
 * This is NOT a device id. It’s just a random UUID per browser.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";

  const key = "wml_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  // Prefer crypto.randomUUID if available
  const uuid =
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : fallbackUuid();

  window.localStorage.setItem(key, uuid);
  return uuid;
}

function fallbackUuid(): string {
  // RFC4122-ish fallback (not cryptographically strong, but fine for anonymous visitor id)
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
