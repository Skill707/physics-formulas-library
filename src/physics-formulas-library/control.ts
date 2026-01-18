import type {
  Dimensionless,
  MetersPerSecond,
  Radians,
  RadiansPerSecond,
  RadiansPerSecondSq,
  Seconds,
} from "./types";
import { G0 } from "./constants";

/** Max pitch rate from g-limit and true airspeed */
export function maxPitchRate(
  gLimit: Dimensionless,
  tas: MetersPerSecond
): RadiansPerSecond {
  return ((gLimit * G0) / tas) as RadiansPerSecond;
}

/** G-load from pitch rate and true airspeed */
export function gLoadFromPitchRate(
  pitchRate: RadiansPerSecond,
  tas: MetersPerSecond
): Dimensionless {
  return ((pitchRate * tas) / G0) as Dimensionless;
}

/** Rate limiter for angular rate commands */
export function rateLimit(
  current: RadiansPerSecond,
  desired: RadiansPerSecond,
  maxRateChange: RadiansPerSecondSq,
  dt: Seconds
): RadiansPerSecond {
  const delta = desired - current;
  const maxDelta = maxRateChange * dt;
  if (delta > maxDelta) return (current + maxDelta) as RadiansPerSecond;
  if (delta < -maxDelta) return (current - maxDelta) as RadiansPerSecond;
  return desired;
}

/** Control surface deflection scaling */
export function controlSurfaceDeflection(
  input: Dimensionless,
  maxDeflection: Radians
): Radians {
  return (input * maxDeflection) as Radians;
}

/** Limit g-load to safe bounds */
export function gLimiter(
  gCmd: Dimensionless,
  gMin: Dimensionless,
  gMax: Dimensionless
): Dimensionless {
  return (Math.max(gMin, Math.min(gMax, gCmd))) as Dimensionless;
}
