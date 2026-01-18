import type {
  Dimensionless,
  Kilograms,
  KilogramsPerCubicMeter,
  KilogramsPerSquareMeter,
  Meters,
  MetersPerSecond,
  Newtons,
  Pascals,
  PascalsSecond,
  SquareMeters,
} from "./types";
import { Vector3 } from "three";

/** Dynamic pressure */
export function dynamicPressure(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond
): Pascals {
  return (0.5 * density * speed * speed) as Pascals;
}

/** Lift force */
export function lift(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond,
  area: SquareMeters,
  cl: Dimensionless
): Newtons {
  return (0.5 * density * speed * speed * area * cl) as Newtons;
}

/** Drag force */
export function drag(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond,
  area: SquareMeters,
  cd: Dimensionless
): Newtons {
  return (0.5 * density * speed * speed * area * cd) as Newtons;
}

/** Lift coefficient from lift force */
export function liftCoefficient(
  liftN: Newtons,
  q: Pascals,
  area: SquareMeters
): Dimensionless {
  return (liftN / (q * area)) as Dimensionless;
}

/** Drag coefficient from drag force */
export function dragCoefficient(
  dragN: Newtons,
  q: Pascals,
  area: SquareMeters
): Dimensionless {
  return (dragN / (q * area)) as Dimensionless;
}

/** Reynolds number */
export function reynoldsNumber(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond,
  length: Meters,
  viscosity: PascalsSecond
): Dimensionless {
  return ((density * speed * length) / viscosity) as Dimensionless;
}

/** Mach number */
export function machNumber(speed: MetersPerSecond, speedOfSound: MetersPerSecond): Dimensionless {
  return (speed / speedOfSound) as Dimensionless;
}

/** Wing aspect ratio */
export function aspectRatio(span: Meters, area: SquareMeters): Dimensionless {
  return ((span * span) / area) as Dimensionless;
}

/** Induced drag coefficient */
export function inducedDragCoefficient(
  cl: Dimensionless,
  aspectRatioValue: Dimensionless,
  oswaldEfficiency: Dimensionless
): Dimensionless {
  return ((cl * cl) / (Math.PI * oswaldEfficiency * aspectRatioValue)) as Dimensionless;
}

/** Wing loading from weight */
export function wingLoadingFromWeight(weight: Newtons, area: SquareMeters): Pascals {
  return (weight / area) as Pascals;
}

/** Wing loading from mass */
export function wingLoadingFromMass(
  mass: Kilograms,
  area: SquareMeters
): KilogramsPerSquareMeter {
  return (mass / area) as KilogramsPerSquareMeter;
}

/** Stall speed from maximum lift coefficient */
export function stallSpeed(
  weight: Newtons,
  density: KilogramsPerCubicMeter,
  area: SquareMeters,
  clMax: Dimensionless
): MetersPerSecond {
  return Math.sqrt((2 * weight) / (density * area * clMax)) as MetersPerSecond;
}

/** Lift force vector */
export function liftVector(
  liftN: Newtons,
  liftDirection: Vector3
): Vector3 {
  return liftDirection.clone().normalize().multiplyScalar(liftN as number);
}

/** Drag force vector */
export function dragVector(
  dragN: Newtons,
  dragDirection: Vector3
): Vector3 {
  return dragDirection.clone().normalize().multiplyScalar(dragN as number);
}

/** Side force vector */
export function sideForceVector(
  sideForceN: Newtons,
  sideDirection: Vector3
): Vector3 {
  return sideDirection.clone().normalize().multiplyScalar(sideForceN as number);
}
