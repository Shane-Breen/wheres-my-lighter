// lib/visitorId.ts
export function getOrCreateVisitorId(storageKey = "wml_visitor_id") {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const id =
    typeof window.crypto !== "undefined" && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : fallbackUUID();

  window.localStorage.setItem(storageKey, id);
  return id;
}

function fallbackUUID() {
  // RFC4122-ish fallback (not crypto-strong, but fine for anonymous visitor ids)
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
