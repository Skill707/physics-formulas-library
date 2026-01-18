import { Vector3, Quaternion } from "three";
import type { Radians } from "./types";

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
): Radians {
  const vBody = velocity.clone().applyQuaternion(q.clone().invert());
  return Math.atan2(vBody.y, -vBody.z) as Radians;
}

/** Sideslip angle (rad) */
export function sideslipAngle(
  velocity: Vector3,
  q: Quaternion
): Radians {
  const vBody = velocity.clone().applyQuaternion(q.clone().invert());
  return Math.atan2(vBody.x, -vBody.z) as Radians;
}

/** Transform a vector from body to world space */
export function bodyToWorldVector(vBody: Vector3, q: Quaternion): Vector3 {
  return vBody.clone().applyQuaternion(q);
}

/** Transform a vector from world to body space */
export function worldToBodyVector(vWorld: Vector3, q: Quaternion): Vector3 {
  return vWorld.clone().applyQuaternion(q.clone().invert());
}

/** Bank angle (rad) from quaternion */
export function bankAngle(q: Quaternion): Radians {
  const upWorld = up(q);
  return Math.atan2(upWorld.x, upWorld.y) as Radians;
}
