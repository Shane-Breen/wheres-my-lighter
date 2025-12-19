// lib/visitorId.ts
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";

  const KEY = "wml_visitor_id";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const id = safeUuid();
  window.localStorage.setItem(KEY, id);
  return id;
}

function safeUuid(): string {
  const c = (globalThis as any).crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();

  // Fallback UUID-ish (stable enough for visitor_id)
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `${rnd().slice(0, 8)}-${rnd().slice(0, 4)}-4${rnd().slice(0, 3)}-a${rnd().slice(0, 3)}-${rnd().slice(0, 12)}`;
}
