// lib/avatar.ts
// Returns a data URL (SVG) so we don't need image files yet.

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function avatarDataUrl(seed: string, hatched: boolean) {
  const h = hashStr(seed);
  const palette = [
    { bg: "#0b0b18", a: "#7c3aed", b: "#c4b5fd", c: "#111827" },
    { bg: "#070717", a: "#6d28d9", b: "#ddd6fe", c: "#0f172a" },
    { bg: "#0a0a1a", a: "#8b5cf6", b: "#e9d5ff", c: "#111827" },
  ][h % 3];

  const svg = hatched ? courierSvg(palette) : eggSvg(palette);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function eggSvg(p: { bg: string; a: string; b: string; c: string }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="256" height="256" rx="28" fill="${p.bg}"/>
  <g transform="translate(42,30)">
    <rect x="0" y="0" width="172" height="196" rx="26" fill="rgba(124,58,237,0.10)"/>
    <ellipse cx="86" cy="110" rx="56" ry="70" fill="${p.a}" opacity="0.22"/>
    <ellipse cx="86" cy="112" rx="48" ry="62" fill="${p.b}" opacity="0.18"/>
    <path d="M56 134c14-10 22-10 36 0c14-10 22-10 36 0" fill="none" stroke="${p.b}" stroke-width="6" opacity="0.55"/>
    <circle cx="70" cy="104" r="6" fill="${p.c}" opacity="0.65"/>
    <circle cx="102" cy="104" r="6" fill="${p.c}" opacity="0.65"/>
  </g>
</svg>`;
}

function courierSvg(p: { bg: string; a: string; b: string; c: string }) {
  // Pixel-y courier holding a flame
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="256" height="256" rx="28" fill="${p.bg}"/>
  <g shape-rendering="crispEdges" transform="translate(52,44) scale(4)">
    <!-- body -->
    <rect x="14" y="18" width="18" height="18" fill="${p.a}" opacity="0.95"/>
    <rect x="16" y="20" width="14" height="14" fill="${p.c}" opacity="0.55"/>
    <!-- head -->
    <rect x="16" y="8" width="14" height="12" fill="${p.b}" opacity="0.9"/>
    <rect x="18" y="10" width="4" height="4" fill="${p.c}" opacity="0.75"/>
    <rect x="24" y="10" width="4" height="4" fill="${p.c}" opacity="0.75"/>
    <!-- hood -->
    <rect x="15" y="7" width="16" height="4" fill="${p.a}" opacity="0.65"/>
    <!-- arm -->
    <rect x="32" y="20" width="8" height="4" fill="${p.a}" opacity="0.9"/>
    <!-- flame -->
    <rect x="40" y="16" width="3" height="3" fill="#FDE047"/>
    <rect x="40" y="19" width="3" height="3" fill="#F59E0B"/>
  </g>
</svg>`;
}
