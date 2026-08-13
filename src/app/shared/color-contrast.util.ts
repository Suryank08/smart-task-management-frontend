/** Picks readable black/white text for an arbitrary background hex color, via relative luminance. */
export function getContrastTextColor(hex: string | null | undefined, fallback = '#ffffff'): string {
  if (!hex) return fallback;
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return fallback;

  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const linearize = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
