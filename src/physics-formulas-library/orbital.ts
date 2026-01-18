import type {
  Kilograms,
  Meters,
  MetersCubedPerSecondSq,
  MetersPerSecond,
  RadiansPerSecond,
  Seconds,
  SquareMetersPerSecondSq,
} from "./types";
import { BIG_G } from "./constants";

/** Standard gravitational parameter: mu = G * M */
export function gravitationalParameter(mass: Kilograms): MetersCubedPerSecondSq {
  return (BIG_G * mass) as MetersCubedPerSecondSq;
}

/** Circular orbital velocity */
export function circularOrbitVelocity(
  mu: MetersCubedPerSecondSq,
  radius: Meters
): MetersPerSecond {
  return Math.sqrt((mu / radius) as number) as MetersPerSecond;
}

/** Escape velocity */
export function escapeVelocity(
  mu: MetersCubedPerSecondSq,
  radius: Meters
): MetersPerSecond {
  return Math.sqrt(((2 * mu) / radius) as number) as MetersPerSecond;
}

/** Orbital period for an elliptical orbit */
export function orbitalPeriod(
  mu: MetersCubedPerSecondSq,
  semiMajorAxis: Meters
): Seconds {
  return (2 * Math.PI * Math.sqrt(((semiMajorAxis * semiMajorAxis * semiMajorAxis) / mu) as number)) as Seconds;
}

/** Mean motion n = sqrt(mu / a^3) */
export function meanMotion(
  mu: MetersCubedPerSecondSq,
  semiMajorAxis: Meters
): RadiansPerSecond {
  return Math.sqrt((mu / (semiMajorAxis * semiMajorAxis * semiMajorAxis)) as number) as RadiansPerSecond;
}

/** Vis-viva equation */
export function visVivaSpeed(
  mu: MetersCubedPerSecondSq,
  radius: Meters,
  semiMajorAxis: Meters
): MetersPerSecond {
  return Math.sqrt((mu * (2 / radius - 1 / semiMajorAxis)) as number) as MetersPerSecond;
}

/** Specific orbital energy */
export function specificOrbitalEnergy(
  mu: MetersCubedPerSecondSq,
  semiMajorAxis: Meters
): SquareMetersPerSecondSq {
  return (-(mu / (2 * semiMajorAxis)) as number) as SquareMetersPerSecondSq;
}
