import type {
  Meters,
  MetersPerSecond,
  MetersPerSecondSq,
  Radians,
  RadiansPerSecond,
  RadiansPerSecondSq,
  Seconds,
} from "./types";
import { Vector3 } from "three";

/** Final velocity for constant acceleration */
export function finalVelocity(
  v0: MetersPerSecond,
  a: MetersPerSecondSq,
  t: Seconds
): MetersPerSecond {
  return (v0 + a * t) as MetersPerSecond;
}

/** Displacement for constant acceleration */
export function displacement(
  s0: Meters,
  v0: MetersPerSecond,
  a: MetersPerSecondSq,
  t: Seconds
): Meters {
  return (s0 + v0 * t + 0.5 * a * t * t) as Meters;
}

/** Average velocity for constant acceleration */
export function averageVelocity(
  v0: MetersPerSecond,
  v1: MetersPerSecond
): MetersPerSecond {
  return ((v0 + v1) * 0.5) as MetersPerSecond;
}

/** Acceleration from initial and final velocity */
export function accelerationFromVelocities(
  v0: MetersPerSecond,
  v1: MetersPerSecond,
  t: Seconds
): MetersPerSecondSq {
  return ((v1 - v0) / t) as MetersPerSecondSq;
}

/** Time to change velocity at constant acceleration */
export function timeFromVelocities(
  v0: MetersPerSecond,
  v1: MetersPerSecond,
  a: MetersPerSecondSq
): Seconds {
  return ((v1 - v0) / a) as Seconds;
}

/** Stopping distance for constant deceleration */
export function stoppingDistance(
  v0: MetersPerSecond,
  decel: MetersPerSecondSq
): Meters {
  return ((v0 * v0) / (2 * decel)) as Meters;
}

/** Angular displacement for constant angular acceleration */
export function angularDisplacement(
  theta0: Radians,
  omega0: RadiansPerSecond,
  alpha: RadiansPerSecondSq,
  t: Seconds
): Radians {
  return (theta0 + omega0 * t + 0.5 * alpha * t * t) as Radians;
}

/** Final angular velocity for constant angular acceleration */
export function angularVelocityFinal(
  omega0: RadiansPerSecond,
  alpha: RadiansPerSecondSq,
  t: Seconds
): RadiansPerSecond {
  return (omega0 + alpha * t) as RadiansPerSecond;
}

/** Angular acceleration from angular velocities */
export function angularAccelerationFromVelocities(
  omega0: RadiansPerSecond,
  omega1: RadiansPerSecond,
  t: Seconds
): RadiansPerSecondSq {
  return ((omega1 - omega0) / t) as RadiansPerSecondSq;
}

/** Tangential velocity from angular rate and radius */
export function tangentialVelocity(
  omega: RadiansPerSecond,
  radius: Meters
): MetersPerSecond {
  return (omega * radius) as MetersPerSecond;
}

/** Centripetal acceleration from speed and radius */
export function centripetalAcceleration(
  v: MetersPerSecond,
  radius: Meters
): MetersPerSecondSq {
  return ((v * v) / radius) as MetersPerSecondSq;
}

/** Centripetal acceleration from angular rate and radius */
export function centripetalAccelerationFromOmega(
  omega: RadiansPerSecond,
  radius: Meters
): MetersPerSecondSq {
  return ((omega * omega) * radius) as MetersPerSecondSq;
}

/** Relative velocity (1D) */
export function relativeVelocity(
  vA: MetersPerSecond,
  vB: MetersPerSecond
): MetersPerSecond {
  return (vA - vB) as MetersPerSecond;
}

/** Projectile range without air drag */
export function projectileRange(
  v0: MetersPerSecond,
  theta: Radians,
  g: MetersPerSecondSq
): Meters {
  return ((v0 * v0 * Math.sin(2 * theta)) / g) as Meters;
}

/** Maximum projectile height without air drag */
export function projectileMaxHeight(
  v0: MetersPerSecond,
  theta: Radians,
  g: MetersPerSecondSq
): Meters {
  const vy0 = v0 * Math.sin(theta);
  return ((vy0 * vy0) / (2 * g)) as Meters;
}

/** Coriolis acceleration: -2 * omega x v */
export function coriolisAcceleration(
  angularVelocity: Vector3,
  velocity: Vector3
): Vector3 {
  return angularVelocity.clone().cross(velocity).multiplyScalar(-2);
}

/** Centrifugal acceleration: -omega x (omega x r) */
export function centrifugalAcceleration(
  angularVelocity: Vector3,
  position: Vector3
): Vector3 {
  const omegaCrossR = angularVelocity.clone().cross(position);
  return angularVelocity.clone().cross(omegaCrossR).multiplyScalar(-1);
}
