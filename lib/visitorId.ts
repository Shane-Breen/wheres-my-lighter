const KEY = "wml_visitor_id";

function uuidFallback() {
  // RFC4122 v4 using crypto.getRandomValues
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "server";

  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : uuidFallback();

  localStorage.setItem(KEY, id);
  return id;
}
