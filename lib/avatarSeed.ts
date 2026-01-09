export function makeSeed(input: string): string {
  return (
    hash32(input).toString(16).padStart(8, "0") +
    hash32(input + "|x").toString(16).padStart(4, "0")
  );
}

function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seedToRng(seed: string) {
  const n = hash32(seed);
  let x = n || 123456789;

  return function rand() {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}
