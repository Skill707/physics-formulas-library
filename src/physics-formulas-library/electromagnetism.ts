import { Vector3 } from "three";
import type {
  Amperes,
  Coulombs,
  Dimensionless,
  JoulesPerCubicMeter,
  Meters,
  MetersPerSecond,
  Newtons,
  NewtonsPerCoulomb,
  Ohms,
  Seconds,
  Teslas,
  Volts,
  VoltsPerMeter,
  Watts,
} from "./types";
import { EPS0, MU0, K_E } from "./constants";

/** Electric field magnitude from point charge */
export function electricFieldPointCharge(
  charge: Coulombs,
  r: Meters
): NewtonsPerCoulomb {
  return ((K_E * charge) / (r * r)) as NewtonsPerCoulomb;
}

/** Electric field vector from point charge */
export function electricFieldVectorPointCharge(
  charge: Coulombs,
  position: Vector3
): Vector3 {
  const r = position.length();
  if (r === 0) return new Vector3(0, 0, 0);
  const magnitude = (K_E * charge) / (r * r);
  return position.clone().normalize().multiplyScalar(magnitude);
}

/** Electric potential from point charge */
export function electricPotentialPointCharge(
  charge: Coulombs,
  r: Meters
): Volts {
  return ((K_E * charge) / r) as Volts;
}

/** Lorentz force: F = q (E + v x B) */
export function lorentzForce(
  charge: Coulombs,
  electricField: Vector3,
  velocity: Vector3,
  magneticField: Vector3
): Vector3 {
  const vxB = velocity.clone().cross(magneticField);
  return electricField.clone().add(vxB).multiplyScalar(charge as number);
}

/** Magnetic force magnitude on a moving charge */
export function magneticForceMagnitude(
  charge: Coulombs,
  speed: MetersPerSecond,
  magneticField: Teslas,
  sinTheta: Dimensionless
): Newtons {
  return (charge * speed * magneticField * sinTheta) as Newtons;
}

/** Electric field from potential difference and distance */
export function electricFieldFromPotential(
  voltage: Volts,
  distance: Meters
): VoltsPerMeter {
  return (voltage / distance) as VoltsPerMeter;
}

/** Current from charge and time */
export function currentFromCharge(
  charge: Coulombs,
  time: Seconds
): Amperes {
  return (charge / time) as Amperes;
}

/** Ohm's law: V = I * R */
export function voltageFromCurrent(
  current: Amperes,
  resistance: Ohms
): Volts {
  return (current * resistance) as Volts;
}

/** Ohm's law: I = V / R */
export function currentFromVoltage(
  voltage: Volts,
  resistance: Ohms
): Amperes {
  return (voltage / resistance) as Amperes;
}

/** Electrical power: P = V * I */
export function electricalPower(
  voltage: Volts,
  current: Amperes
): Watts {
  return (voltage * current) as Watts;
}

/** Electric energy density: 1/2 * eps0 * E^2 */
export function electricEnergyDensity(
  electricField: VoltsPerMeter
): JoulesPerCubicMeter {
  return (0.5 * (EPS0 as number) * electricField * electricField) as JoulesPerCubicMeter;
}

/** Magnetic energy density: B^2 / (2 * mu0) */
export function magneticEnergyDensity(
  magneticField: Teslas
): JoulesPerCubicMeter {
  return ((magneticField * magneticField) / (2 * (MU0 as number))) as JoulesPerCubicMeter;
}
