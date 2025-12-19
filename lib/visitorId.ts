// lib/visitorId.ts
// Stable, browser-safe visitor id generator.
// - Uses crypto.randomUUID when available
// - Falls back to getRandomValues
// - Final fallback: Math.random (still fine for a client visitor id)
// IMPORTANT: Only call getOrCreateVisitorId() from client components.

const KEY = "wml_visitor_id";

function uuidv4Fallback(): string {
  // Prefer Web Crypto if available (typed safely)
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;

  // randomUUID (best)
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  // getRandomValues (good)
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);

    // RFC 4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
      16,
      20
    )}-${hex.slice(20)}`;
  }

  // Math.random fallback (last resort)
  const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;

    const id = uuidv4Fallback();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // If storage blocked, still return a stable-ish session id
    return uuidv4Fallback();
  }
}
