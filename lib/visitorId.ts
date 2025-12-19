// lib/visitorId.ts
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";

  const key = "wml_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = safeUUID();
  window.localStorage.setItem(key, id);
  return id;
}

function safeUUID(): string {
  // Prefer randomUUID when available
  // @ts-ignore
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    // @ts-ignore
    return crypto.randomUUID();
  }

  // Fallback UUID v4-ish
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // RFC4122 v4 bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}
