// lib/visitorId.ts
// Client-safe visitor id stored in localStorage.
// Avoids TS "never" crypto issues by using globalThis + type guards.

export function getOrCreateVisitorId(storageKey = "wml_visitor_id"): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;

    const id = safeUuid();
    window.localStorage.setItem(storageKey, id);
    return id;
  } catch {
    // If storage blocked, still return a stable-ish id for this session
    return safeUuid();
  }
}

function safeUuid(): string {
  // Prefer crypto.randomUUID if available
  const g: any = globalThis as any;

  if (g?.crypto?.randomUUID && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }

  // Fallback: build a UUID-ish string using random bytes if possible
  const bytes = new Uint8Array(16);

  if (g?.crypto?.getRandomValues && typeof g.crypto.getRandomValues === "function") {
    g.crypto.getRandomValues(bytes);
  } else {
    // last-resort fallback
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // RFC4122-ish v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
