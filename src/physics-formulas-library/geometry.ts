import { Vector3 } from "three";
import type { Dimensionless, Meters, Newtons } from "./types";

/** Projection of vector a onto vector b */
export function projectVector(a: Vector3, b: Vector3): Vector3 {
  const denom = b.lengthSq();
  if (denom === 0) return new Vector3(0, 0, 0);
  const scale = a.dot(b) / denom;
  return b.clone().multiplyScalar(scale);
}

/** Rejection of vector a from vector b */
export function rejectVector(a: Vector3, b: Vector3): Vector3 {
  return a.clone().sub(projectVector(a, b));
}

/** Reflect vector around a normal */
export function reflectVector(v: Vector3, normal: Vector3): Vector3 {
  const n = normal.clone().normalize();
  return v.clone().sub(n.multiplyScalar(2 * v.dot(n)));
}

/** Moment of a force about a point: r x F */
export function momentFromPoint(
  point: Vector3,
  force: Vector3
): Vector3 {
  return point.clone().cross(force);
}

/** Distance from a point to a plane */
export function distancePointToPlane(
  point: Vector3,
  planeNormal: Vector3,
  planeOffset: Meters
): Meters {
  const n = planeNormal.clone().normalize();
  return (point.dot(n) - planeOffset) as Meters;
}

/** Decompose vector into parallel and perpendicular components */
export function decomposeVector(
  v: Vector3,
  axis: Vector3
): { parallel: Vector3; perpendicular: Vector3 } {
  const parallel = projectVector(v, axis);
  return { parallel, perpendicular: v.clone().sub(parallel) };
}
