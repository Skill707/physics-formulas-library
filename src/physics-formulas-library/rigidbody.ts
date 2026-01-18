import { Matrix3, Vector3 } from "three";
import type {
  KilogramSquareMeters,
  Kilograms,
  Meters,
} from "./types";

/** Inertia tensor for a solid box about its center */
export function inertiaTensorBox(
  mass: Kilograms,
  width: Meters,
  height: Meters,
  depth: Meters
): Matrix3 {
  const wx2 = width * width;
  const hy2 = height * height;
  const dz2 = depth * depth;
  const ix = (mass / 12) * (hy2 + dz2);
  const iy = (mass / 12) * (wx2 + dz2);
  const iz = (mass / 12) * (wx2 + hy2);
  const m = new Matrix3();
  m.set(ix, 0, 0, 0, iy, 0, 0, 0, iz);
  return m;
}

/** Inertia tensor for a solid sphere about its center */
export function inertiaTensorSphere(
  mass: Kilograms,
  radius: Meters
): Matrix3 {
  const i = (0.4 * mass * radius * radius) as number;
  const m = new Matrix3();
  m.set(i, 0, 0, 0, i, 0, 0, 0, i);
  return m;
}

/** Inertia tensor for a solid cylinder about its center (axis along z) */
export function inertiaTensorCylinder(
  mass: Kilograms,
  radius: Meters,
  height: Meters
): Matrix3 {
  const r2 = radius * radius;
  const h2 = height * height;
  const ix = (mass / 12) * (3 * r2 + h2);
  const iy = ix;
  const iz = 0.5 * mass * r2;
  const m = new Matrix3();
  m.set(ix, 0, 0, 0, iy, 0, 0, 0, iz);
  return m;
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

/** Parallel axis theorem: I = Icm + m * d^2 */
export function parallelAxis(
  inertiaCm: KilogramSquareMeters,
  mass: Kilograms,
  distance: Meters
): KilogramSquareMeters {
  return (inertiaCm + mass * distance * distance) as KilogramSquareMeters;
}

/** Moment about an arbitrary unit axis: I = a^T I a */
export function momentAboutAxis(inertia: Matrix3, axis: Vector3): KilogramSquareMeters {
  const a = axis.clone().normalize();
  const ia = a.clone().applyMatrix3(inertia);
  return (a.dot(ia)) as KilogramSquareMeters;
}

/** Angular momentum vector: L = I * omega */
export function angularMomentumFromInertia(inertia: Matrix3, omega: Vector3): Vector3 {
  return omega.clone().applyMatrix3(inertia);
}

/** Gyroscopic torque: tau = omega x L */
export function gyroscopicTorque(omega: Vector3, angularMomentum: Vector3): Vector3 {
  return omega.clone().cross(angularMomentum);
}
