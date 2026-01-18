import { Vector3 } from "three";
import type { Dimensionless, Meters } from "./types";

export type AirfoilPoint = { x: Meters; y: Meters };
export type AirfoilSurface = {
  upper: AirfoilPoint[];
  lower: AirfoilPoint[];
  camber: AirfoilPoint[];
};

export type Naca4Parameters = {
  m: Dimensionless;
  p: Dimensionless;
  t: Dimensionless;
  chord: Meters;
  resolution: number;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

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

/** NACA 4-digit airfoil coordinates with cosine spacing */
export function generateNaca4Airfoil({
  m,
  p,
  t,
  chord,
  resolution,
}: Naca4Parameters): AirfoilSurface {
  const mVal = clamp01(m as number);
  const pVal = clamp01(p as number);
  const tVal = clamp01(t as number);
  const count = Math.max(20, Math.floor(resolution));
  const upper: AirfoilPoint[] = [];
  const lower: AirfoilPoint[] = [];
  const camber: AirfoilPoint[] = [];

  for (let i = 0; i <= count; i += 1) {
    const theta = (Math.PI * i) / count;
    const xBar = 0.5 * (1 - Math.cos(theta));
    const x = (xBar * (chord as number)) as Meters;

    let yc = 0;
    let dycDx = 0;
    if (mVal > 0 && pVal > 0) {
      if (xBar < pVal) {
        yc = (mVal / (pVal * pVal)) * (2 * pVal * xBar - xBar * xBar);
        dycDx = (2 * mVal / (pVal * pVal)) * (pVal - xBar);
      } else {
        const denom = (1 - pVal) * (1 - pVal);
        yc = (mVal / denom) * ((1 - 2 * pVal) + 2 * pVal * xBar - xBar * xBar);
        dycDx = (2 * mVal / denom) * (pVal - xBar);
      }
    }

    const thickness =
      5 *
      tVal *
      (0.2969 * Math.sqrt(xBar) -
        0.126 * xBar -
        0.3516 * xBar * xBar +
        0.2843 * Math.pow(xBar, 3) -
        0.1015 * Math.pow(xBar, 4));

    const thetaCamber = Math.atan(dycDx);
    const sinT = Math.sin(thetaCamber);
    const cosT = Math.cos(thetaCamber);
    const yt = thickness * (chord as number);
    const xc = xBar * (chord as number);
    const ycMeters = yc * (chord as number);

    const xu = (xc - yt * sinT) as Meters;
    const yu = (ycMeters + yt * cosT) as Meters;
    const xl = (xc + yt * sinT) as Meters;
    const yl = (ycMeters - yt * cosT) as Meters;

    upper.push({ x: xu, y: yu });
    lower.push({ x: xl, y: yl });
    camber.push({ x, y: ycMeters as Meters });
  }

  return { upper, lower, camber };
}
