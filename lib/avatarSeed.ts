// Deterministic seed + tiny PRNG (stable across reloads)
// No crypto dependency, works in Node runtime.

export function makeSeed(input: string): string {
  // 12-char hex-ish seed
  return hash32(input).toString(16).padStart(8, "0") + hash32(input + "|x").toString(16).padStart(4, "0");
}

function hash32(str: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 to keep unsigned
  return h >>> 0;
}

export function seedToRng(seed: string) {
  // Simple xorshift32 seeded from the seed string
  const n = hash32(seed);
  let x = n || 123456789;

  return function rand() {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // 0..1
    return ((x >>> 0) % 100000) / 100000;
  };
}
