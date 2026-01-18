import type { Degrees, Radians } from "./types";

export const degToRad = (deg: Degrees): Radians => ((deg * Math.PI) / 180) as Radians;

export const radToDeg = (rad: Radians): Degrees => ((rad * 180) / Math.PI) as Degrees;
