import type {
  CubicMeters,
  Dimensionless,
  Joules,
  KilogramMetersPerSecond,
  KilogramSquareMeters,
  KilogramSquareMetersPerSecond,
  Kilograms,
  KilogramsPerCubicMeter,
  Meters,
  MetersPerSecond,
  MetersPerSecondSq,
  NewtonMeters,
  NewtonSeconds,
  Newtons,
  NewtonsPerMeter,
  Pascals,
  RadiansPerSecond,
  SquareMeters,
  Seconds,
  Watts,
} from "./types";
import { BIG_G } from "./constants";
import { Vector3 } from "three";

/** Newton's second law */
export function force(mass: Kilograms, acceleration: MetersPerSecondSq): Newtons {
  return (mass * acceleration) as Newtons;
}

/** Acceleration from force and mass */
export function accelerationFromForce(forceN: Newtons, mass: Kilograms): MetersPerSecondSq {
  return (forceN / mass) as MetersPerSecondSq;
}

/** Weight from mass and gravity */
export function weight(mass: Kilograms, g: MetersPerSecondSq): Newtons {
  return (mass * g) as Newtons;
}

/** Kinetic energy */
export function kineticEnergy(mass: Kilograms, velocity: MetersPerSecond): Joules {
  return (0.5 * mass * velocity * velocity) as Joules;
}

/** Gravitational potential energy */
export function potentialEnergy(mass: Kilograms, g: MetersPerSecondSq, height: Meters): Joules {
  return (mass * g * height) as Joules;
}

/** Work from constant force along displacement */
export function work(forceN: Newtons, displacement: Meters): Joules {
  return (forceN * displacement) as Joules;
}

/** Power from work over time */
export function powerFromWork(workJ: Joules, time: Seconds): Watts {
  return (workJ / time) as Watts;
}

/** Power from force and velocity */
export function powerFromForce(forceN: Newtons, velocity: MetersPerSecond): Watts {
  return (forceN * velocity) as Watts;
}

/** Linear momentum */
export function momentum(mass: Kilograms, velocity: MetersPerSecond): KilogramMetersPerSecond {
  return (mass * velocity) as KilogramMetersPerSecond;
}

/** Linear momentum vector */
export function momentumVector(mass: Kilograms, velocity: Vector3): Vector3 {
  return velocity.clone().multiplyScalar(mass as number);
}

/** Impulse from force and time */
export function impulse(forceN: Newtons, time: Seconds): NewtonSeconds {
  return (forceN * time) as NewtonSeconds;
}

/** Impulse vector */
export function impulseVector(force: Vector3, time: Seconds): Vector3 {
  return force.clone().multiplyScalar(time as number);
}

/** Torque from force and moment arm */
export function torque(forceN: Newtons, momentArm: Meters): NewtonMeters {
  return (forceN * momentArm) as NewtonMeters;
}

/** Torque vector: r x F */
export function torqueVector(momentArm: Vector3, force: Vector3): Vector3 {
  return momentArm.clone().cross(force);
}

/** Angular momentum vector: r x p */
export function angularMomentumVector(position: Vector3, momentumVec: Vector3): Vector3 {
  return position.clone().cross(momentumVec);
}

/** Rotational kinetic energy */
export function rotationalKineticEnergy(
  inertia: KilogramSquareMeters,
  omega: RadiansPerSecond
): Joules {
  return (0.5 * inertia * omega * omega) as Joules;
}

/** Angular momentum */
export function angularMomentum(
  inertia: KilogramSquareMeters,
  omega: RadiansPerSecond
): KilogramSquareMetersPerSecond {
  return (inertia * omega) as KilogramSquareMetersPerSecond;
}

/** Centripetal force */
export function centripetalForce(
  mass: Kilograms,
  velocity: MetersPerSecond,
  radius: Meters
): Newtons {
  return ((mass * velocity * velocity) / radius) as Newtons;
}

/** Hooke's law spring force magnitude */
export function springForce(k: NewtonsPerMeter, displacement: Meters): Newtons {
  return (k * displacement) as Newtons;
}

/** Elastic potential energy */
export function springPotentialEnergy(k: NewtonsPerMeter, displacement: Meters): Joules {
  return (0.5 * k * displacement * displacement) as Joules;
}

/** Friction force */
export function frictionForce(mu: Dimensionless, normalForce: Newtons): Newtons {
  return (mu * normalForce) as Newtons;
}

/** Pressure force on a surface */
export function pressureForce(pressure: Pascals, area: SquareMeters): Newtons {
  return (pressure * area) as Newtons;
}

/** Hydrostatic pressure at depth */
export function hydrostaticPressure(
  density: KilogramsPerCubicMeter,
  g: MetersPerSecondSq,
  depth: Meters
): Pascals {
  return (density * g * depth) as Pascals;
}

/** Buoyant force */
export function buoyantForce(
  density: KilogramsPerCubicMeter,
  g: MetersPerSecondSq,
  volume: CubicMeters
): Newtons {
  return (density * g * volume) as Newtons;
}

/** Universal gravitation force magnitude */
export function gravitationalForce(
  m1: Kilograms,
  m2: Kilograms,
  r: Meters
): Newtons {
  return ((BIG_G * m1 * m2) / (r * r)) as Newtons;
}

/** Moment of inertia for a solid cylinder about its axis */
export function inertiaSolidCylinder(mass: Kilograms, radius: Meters): KilogramSquareMeters {
  return (0.5 * mass * radius * radius) as KilogramSquareMeters;
}

/** Moment of inertia for a solid sphere about its axis */
export function inertiaSolidSphere(mass: Kilograms, radius: Meters): KilogramSquareMeters {
  return (0.4 * mass * radius * radius) as KilogramSquareMeters;
}

/** Moment of inertia for a thin rod about its center */
export function inertiaRodCenter(mass: Kilograms, length: Meters): KilogramSquareMeters {
  return ((1 / 12) * mass * length * length) as KilogramSquareMeters;
}
