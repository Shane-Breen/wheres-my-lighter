// lib/visitorId.ts
"use client";

const KEY = "wml_visitor_id_v1";

function uuidv4() {
  // Browser-safe UUID
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getVisitorId() {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = uuidv4();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // If storage blocked, still provide a session id
    return uuidv4();
  }
}
