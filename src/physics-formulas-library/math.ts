import type { Dimensionless } from "./types";

/** Clamp a dimensionless value */
export const clamp = (x: Dimensionless, a: Dimensionless, b: Dimensionless): Dimensionless =>
  (Math.max(a, Math.min(b, x)) as Dimensionless);

/** Linear interpolation for dimensionless values */
export const lerp = (a: Dimensionless, b: Dimensionless, t: Dimensionless): Dimensionless =>
  (a + (b - a) * t) as Dimensionless;
