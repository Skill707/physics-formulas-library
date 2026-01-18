import type { Radians, MetersPerSecond } from "./types";
import { G } from "./constants";

export function maxPitchRate(
  gLimit: number,
  tas: MetersPerSecond
): Radians {
  return ((gLimit * G) / tas) as Radians;
}
