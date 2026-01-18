import { Vector3, Quaternion } from "three";

/** Forward direction in world space */
export function forward(q: Quaternion): Vector3 {
  return new Vector3(0, 0, -1).applyQuaternion(q);
}

/** Up direction in world space */
export function up(q: Quaternion): Vector3 {
  return new Vector3(0, 1, 0).applyQuaternion(q);
}

/** Right direction in world space */
export function right(q: Quaternion): Vector3 {
  return new Vector3(1, 0, 0).applyQuaternion(q);
}

/** Angle of attack (rad) */
export function angleOfAttack(
  velocity: Vector3,
  q: Quaternion
): number {
  const vBody = velocity.clone().applyQuaternion(q.clone().invert());
  return Math.atan2(vBody.y, vBody.z);
}
