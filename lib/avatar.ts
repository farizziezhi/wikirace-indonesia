/**
 * Helper deterministic untuk avatar berwarna per username.
 * Hash sederhana → pilih satu warna dari palette signature Playdate.
 */

const PALETTE = [
  "#7700ff", // crank violet
  "#21c6a9", // seafoam teal
  "#127866", // deep teal
  "#ffc500", // playdate yellow
  "#ff7614", // tangerine (dipakai sebagai warna kontras)
  "#e0245e", // raspberry
  "#3859f9", // electric blue
  "#0a8754", // pine green
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return Math.abs(h);
}

/** Ambil warna avatar untuk seorang pemain (deterministik). */
export function avatarColor(seed: string): string {
  if (!seed) return PALETTE[0];
  return PALETTE[hashString(seed) % PALETTE.length];
}

/** Ambil inisial 1-2 huruf untuk username. */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
