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
  Radians,
  SquareMeters,
} from "./types";
import { Vector3 } from "three";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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

/** Reynolds number at chord location x */
export function reynoldsNumberAtX(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond,
  x: Meters,
  viscosity: PascalsSecond
): Dimensionless {
  return ((density * speed * x) / viscosity) as Dimensionless;
}

/** Reynolds number based on chord */
export function reynoldsNumberChord(
  density: KilogramsPerCubicMeter,
  speed: MetersPerSecond,
  chord: Meters,
  viscosity: PascalsSecond
): Dimensionless {
  return ((density * speed * chord) / viscosity) as Dimensionless;
}

/** Thin airfoil lift coefficient with clamping */
export function thinAirfoilLiftCoefficient(
  alpha: Radians,
  clLimit: Dimensionless = 1.6 as Dimensionless
): Dimensionless {
  const raw = (2 * Math.PI * (alpha as number)) as number;
  return clamp(raw, -(clLimit as number), clLimit as number) as Dimensionless;
}

/** Chordwise pressure coefficient for visualization */
export function chordwisePressureCoefficient(
  xOverC: Dimensionless,
  cl: Dimensionless,
  camber: Dimensionless,
  surface: "upper" | "lower"
): Dimensionless {
  const x = clamp(xOverC as number, 1e-4, 0.999);
  const suction = (1.1 + 0.6 * (1 - x)) * Math.sqrt(1 - x);
  const camberBias = 0.25 * (camber as number) * (1 - x);
  const signed = surface === "upper" ? -1 : 1;
  return (signed * (suction + camberBias) * (cl as number)) as Dimensionless;
}

/** Static pressure from pressure coefficient */
export function pressureFromCoefficient(
  pInf: Pascals,
  q: Pascals,
  cp: Dimensionless
): Pascals {
  return (pInf + q * (cp as number)) as Pascals;
}

/** Laminar skin friction coefficient at x */
export function laminarSkinFrictionCoefficient(
  reynoldsX: Dimensionless
): Dimensionless {
  const re = Math.max(1, reynoldsX as number);
  return (0.664 / Math.sqrt(re)) as Dimensionless;
}

/** Turbulent skin friction coefficient at x */
export function turbulentSkinFrictionCoefficient(
  reynoldsX: Dimensionless
): Dimensionless {
  const re = Math.max(1, reynoldsX as number);
  return (0.0592 / Math.pow(re, 1 / 5)) as Dimensionless;
}

/** Wall shear stress */
export function wallShearStress(q: Pascals, cf: Dimensionless): Pascals {
  return (q * (cf as number)) as Pascals;
}

/** Skin friction drag coefficient from integrating Cf along the chord */
export function skinFrictionDragCoefficient(
  reynoldsChord: Dimensionless,
  isLaminar: boolean,
  samples = 80
): Dimensionless {
  const n = Math.max(10, Math.floor(samples));
  let accum = 0;
  let prevCf = 0;
  let prevX = 1 / n;
  for (let i = 1; i <= n; i += 1) {
    const x = i / n;
    const reX = (reynoldsChord as number) * x;
    const cf = isLaminar
      ? (laminarSkinFrictionCoefficient(reX as Dimensionless) as number)
      : (turbulentSkinFrictionCoefficient(reX as Dimensionless) as number);
    if (i > 1) {
      accum += 0.5 * (cf + prevCf) * (x - prevX);
    }
    prevCf = cf;
    prevX = x;
  }
  return accum as Dimensionless;
}

/** Pressure drag coefficient */
export function pressureDragCoefficient(
  cl: Dimensionless,
  cd0: Dimensionless,
  k: Dimensionless
): Dimensionless {
  return ((cd0 as number) + (k as number) * (cl as number) * (cl as number)) as Dimensionless;
}

/** Total drag coefficient */
export function totalDragCoefficient(
  cdFriction: Dimensionless,
  cdPressure: Dimensionless
): Dimensionless {
  return ((cdFriction as number) + (cdPressure as number)) as Dimensionless;
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
