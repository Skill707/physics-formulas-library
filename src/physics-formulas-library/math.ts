export const clamp = (x: number, a: number, b: number) =>
  Math.max(a, Math.min(b, x));

export const lerp = (a: number, b: number, t: number) =>
  a + (b - a) * t;
