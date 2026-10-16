/** Parses '#RGB', '#RRGGBB', 'rgb(...)' or 'rgba(...)' into 0-255 channels and a 0-1 alpha. */
export function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const value = input.trim();

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, '$&$&') : hex[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgb = value.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i,
  );
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] };
  }
  return null;
}

/**
 * Flattens a (possibly translucent) colour onto an opaque base and returns an opaque '#RRGGBB'.
 * Drawing one opaque layer is much cheaper on a GPU than blending translucent layers.
 * Unparseable input returns the base unchanged.
 */
export function blendOver(top: string, base: string): string {
  const t = parseColor(top);
  const b = parseColor(base);
  if (!b) return base;
  if (!t) return base;

  const mix = (front: number, back: number) => Math.round(front * t.a + back * (1 - t.a));
  const channel = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${channel(mix(t.r, b.r))}${channel(mix(t.g, b.g))}${channel(mix(t.b, b.b))}`;
}
