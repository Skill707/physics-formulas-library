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
  SquareMetersPerSecond,
} from "./types";
import { Vector2, Vector3 } from "three";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export type Panel = {
  start: Vector2;
  end: Vector2;
  control: Vector2;
  tangent: Vector2;
  normal: Vector2;
  length: Meters;
};

export type PanelMethodSolution = {
  panels: Panel[];
  sigma: MetersPerSecond[];
  gamma: SquareMetersPerSecond;
  vt: MetersPerSecond[];
  cp: Dimensionless[];
};

const polygonArea = (points: Vector2[]): number => {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return 0.5 * sum;
};

const buildPanels = (contour: Vector2[]): Panel[] => {
  if (contour.length < 3) return [];
  const first = contour[0]!;
  const last = contour[contour.length - 1]!;
  const closed =
    first.distanceTo(last) < 1e-6
      ? contour
      : [...contour, first.clone()];
  const points = polygonArea(closed) > 0 ? closed.slice().reverse() : closed;
  const panels: Panel[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i]!;
    const end = points[i + 1]!;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) continue;
    const tangent = new Vector2(dx / length, dy / length);
    const normal = new Vector2(tangent.y, -tangent.x); // clockwise outward
    const control = new Vector2((start.x + end.x) * 0.5, (start.y + end.y) * 0.5);
    panels.push({
      start: start.clone(),
      end: end.clone(),
      control,
      tangent,
      normal,
      length: length as Meters,
    });
  }
  return panels;
};

const panelInfluence = (panel: Panel, point: Vector2) => {
  const dx = panel.end.x - panel.start.x;
  const dy = panel.end.y - panel.start.y;
  const length = Math.hypot(dx, dy);
  const cosT = dx / length;
  const sinT = dy / length;
  const xRel = point.x - panel.start.x;
  const yRel = point.y - panel.start.y;
  const xLocal = xRel * cosT + yRel * sinT;
  const yLocal = -xRel * sinT + yRel * cosT;
  const x2 = xLocal - length;
  const r1 = xLocal * xLocal + yLocal * yLocal;
  const r2 = x2 * x2 + yLocal * yLocal;
  const safeR1 = Math.max(r1, 1e-12);
  const safeR2 = Math.max(r2, 1e-12);
  const logTerm = 0.5 * Math.log(safeR1 / safeR2);
  const theta1 = Math.atan2(yLocal, xLocal);
  const theta2 = Math.atan2(yLocal, x2);
  const atanTerm = theta2 - theta1;
  const coeff = 1 / (2 * Math.PI);
  const sourceTangential = coeff * logTerm;
  const sourceNormal = coeff * atanTerm;
  const vortexTangential = coeff * atanTerm;
  const vortexNormal = -coeff * logTerm;
  const sourceVelocity = new Vector2(
    sourceTangential * cosT - sourceNormal * sinT,
    sourceTangential * sinT + sourceNormal * cosT
  );
  const vortexVelocity = new Vector2(
    vortexTangential * cosT - vortexNormal * sinT,
    vortexTangential * sinT + vortexNormal * cosT
  );
  return {
    sourceVelocity,
    vortexVelocity,
  };
};

const solveLinearSystem = (A: number[][], b: number[]): number[] => {
  const n = b.length;
  const M = A.map((row) => row.slice());
  const x = b.slice();

  for (let k = 0; k < n; k += 1) {
    let maxRow = k;
    let maxVal = Math.abs(M[k]![k]!);
    for (let i = k + 1; i < n; i += 1) {
      const val = Math.abs(M[i]![k]!);
      if (val > maxVal) {
        maxVal = val;
        maxRow = i;
      }
    }
    if (maxRow !== k) {
      const tempRow = M[k]!;
      M[k] = M[maxRow]!;
      M[maxRow] = tempRow;
      const tempVal = x[k]!;
      x[k] = x[maxRow]!;
      x[maxRow] = tempVal;
    }
    const pivot = M[k]![k]! || 1e-12;
    for (let i = k + 1; i < n; i += 1) {
      const factor = M[i]![k]! / pivot;
      for (let j = k; j < n; j += 1) {
        M[i]![j]! -= factor * M[k]![j]!;
      }
      x[i] = (x[i] ?? 0) - factor * x[k]!;
    }
  }

  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i -= 1) {
    let sum = x[i]!;
    for (let j = i + 1; j < n; j += 1) {
      sum -= M[i]![j]! * solution[j]!;
    }
    solution[i] = sum / (M[i]![i]! || 1e-12);
  }
  return solution;
};

const findTrailingEdgePanels = (panels: Panel[]) => {
  let upperIndex = 0;
  let lowerIndex = panels.length - 1;
  let maxXUpper = -Infinity;
  let maxXLower = -Infinity;
  panels.forEach((panel, idx) => {
    const x = panel.control.x;
    if (panel.control.y >= 0 && x > maxXUpper) {
      maxXUpper = x;
      upperIndex = idx;
    }
    if (panel.control.y <= 0 && x > maxXLower) {
      maxXLower = x;
      lowerIndex = idx;
    }
  });
  return { upperIndex, lowerIndex };
};

/** 2D panel method for closed airfoil contour */
export function solvePanelMethod(
  contour: Vector2[],
  Vinf: MetersPerSecond,
  alpha: Radians
): PanelMethodSolution {
  const panels = buildPanels(contour);
  const n = panels.length;
  if (n === 0) {
    return { panels: [], sigma: [], gamma: 0 as SquareMetersPerSecond, vt: [], cp: [] };
  }

  const A: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const b: number[] = new Array(n + 1).fill(0);

  const vInfVec = new Vector2(Math.cos(alpha as number), Math.sin(alpha as number)).multiplyScalar(
    Vinf as number
  );

  for (let i = 0; i < n; i += 1) {
    const panelI = panels[i]!;
    const nHat = panelI.normal;
    b[i] = -vInfVec.dot(nHat);
    let vortexSum = 0;
    for (let j = 0; j < n; j += 1) {
      const panelJ = panels[j]!;
      const influence = panelInfluence(panelJ, panelI.control);
      A[i]![j] = influence.sourceVelocity.dot(nHat);
      vortexSum += influence.vortexVelocity.dot(nHat);
    }
    A[i]![n] = vortexSum;
  }

  const { upperIndex, lowerIndex } = findTrailingEdgePanels(panels);
  const upperPanel = panels[upperIndex]!;
  const lowerPanel = panels[lowerIndex]!;
  for (let j = 0; j < n; j += 1) {
    const influenceUpper = panelInfluence(panels[j]!, upperPanel.control);
    const influenceLower = panelInfluence(panels[j]!, lowerPanel.control);
    const tUpper = influenceUpper.sourceVelocity.dot(upperPanel.tangent);
    const tLower = influenceLower.sourceVelocity.dot(lowerPanel.tangent);
    A[n]![j] = tUpper - tLower;
  }
  let vortexUpper = 0;
  let vortexLower = 0;
  for (let j = 0; j < n; j += 1) {
    const influenceUpper = panelInfluence(panels[j]!, upperPanel.control);
    const influenceLower = panelInfluence(panels[j]!, lowerPanel.control);
    vortexUpper += influenceUpper.vortexVelocity.dot(upperPanel.tangent);
    vortexLower += influenceLower.vortexVelocity.dot(lowerPanel.tangent);
  }
  A[n]![n] = vortexUpper - vortexLower;
  b[n] =
    -(
      vInfVec.dot(upperPanel.tangent) -
      vInfVec.dot(lowerPanel.tangent)
    );

  const solution = solveLinearSystem(A, b);
  const sigma = solution.slice(0, n).map((value) => value as MetersPerSecond);
  const gamma = solution[n] as SquareMetersPerSecond;

  const vt: MetersPerSecond[] = [];
  const cp: Dimensionless[] = [];
  const vInfMag = Math.max(1e-6, Vinf as number);

  for (let i = 0; i < n; i += 1) {
    const panelI = panels[i]!;
    let tangential = vInfVec.dot(panelI.tangent);
    let vortexTangential = 0;
    for (let j = 0; j < n; j += 1) {
      const influence = panelInfluence(panels[j]!, panelI.control);
      tangential += (sigma[j] as number) * influence.sourceVelocity.dot(panelI.tangent);
      vortexTangential += influence.vortexVelocity.dot(panelI.tangent);
    }
    tangential += (gamma as number) * vortexTangential;
    const vtValue = tangential as MetersPerSecond;
    vt.push(vtValue);
    const cpValue = (1 - (tangential * tangential) / (vInfMag * vInfMag)) as Dimensionless;
    cp.push(cpValue);
  }

  return { panels, sigma, gamma, vt, cp };
}

/** Velocity field from solved panel method */
export function velocityFromPanels(
  solution: PanelMethodSolution,
  point: Vector2,
  Vinf: MetersPerSecond,
  alpha: Radians
): Vector2 {
  const vInfVec = new Vector2(Math.cos(alpha as number), Math.sin(alpha as number)).multiplyScalar(
    Vinf as number
  );
  let vx = vInfVec.x;
  let vy = vInfVec.y;
  solution.panels.forEach((panel, idx) => {
    const influence = panelInfluence(panel, point);
    const sigma = solution.sigma[idx] as number;
    vx += sigma * influence.sourceVelocity.x;
    vy += sigma * influence.sourceVelocity.y;
    const gamma = solution.gamma as number;
    vx += gamma * influence.vortexVelocity.x;
    vy += gamma * influence.vortexVelocity.y;
  });
  return new Vector2(vx, vy);
}

/** Velocity at a point from solved panels */
export function velocityAtPoint(
  solution: PanelMethodSolution,
  x: Meters,
  y: Meters,
  Vinf: MetersPerSecond,
  alpha: Radians
): Vector2 {
  return velocityFromPanels(solution, new Vector2(x as number, y as number), Vinf, alpha);
}

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
