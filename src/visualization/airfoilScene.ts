import * as THREE from "three";
import { degToRad } from "../physics-formulas-library/units";
import {
  chordwisePressureCoefficient,
  dynamicPressure,
  laminarSkinFrictionCoefficient,
  pressureDragCoefficient,
  reynoldsNumberAtX,
  reynoldsNumberChord,
  skinFrictionDragCoefficient,
  thinAirfoilLiftCoefficient,
  totalDragCoefficient,
  turbulentSkinFrictionCoefficient,
  wallShearStress,
} from "../physics-formulas-library/aerodynamics";
import { densityAtAltitude } from "../physics-formulas-library/atmosphere";
import { generateNaca4Airfoil } from "../physics-formulas-library/geometry";
import type { AirfoilState } from "../store";
import type {
  Dimensionless,
  Meters,
  PascalsSecond,
  Radians,
  SquareMeters,
} from "../physics-formulas-library/types";

const VISCOSITY_AIR = 1.81e-5 as PascalsSecond;
const PRESSURE_ENVELOPE_SCALE = 0.08;
const SHEAR_ENVELOPE_SCALE = 0.05;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toVec3 = (x: number, y: number): THREE.Vector3 => new THREE.Vector3(x, y, 0);

const updateLineGeometry = (line: THREE.Line, points: THREE.Vector3[]): void => {
  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    const idx = i * 3;
    positions[idx] = p.x;
    positions[idx + 1] = p.y;
    positions[idx + 2] = p.z;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  line.geometry.dispose();
  line.geometry = geometry;
};

const computeNormals = (points: THREE.Vector3[], surface: "upper" | "lower"): THREE.Vector3[] => {
  if (points.length === 0) return [];
  return points.map((point, i) => {
    const prev = points[i - 1] ?? point;
    const next = points[i + 1] ?? point;
    const tangent = next.clone().sub(prev);
    const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    if (surface === "upper" && normal.y < 0) normal.multiplyScalar(-1);
    if (surface === "lower" && normal.y > 0) normal.multiplyScalar(-1);
    return normal.lengthSq() === 0 ? new THREE.Vector3(0, surface === "upper" ? 1 : -1, 0) : normal;
  });
};

const buildStreamlines = (
  chord: number,
  alphaRad: number,
  camber: number,
  count: number
): THREE.Vector3[][] => {
  const lines: THREE.Vector3[][] = [];
  const xStart = -0.35 * chord;
  const xEnd = 1.35 * chord;
  const segments = 90;
  const spacing = (1.2 * chord) / Math.max(1, count - 1);
  const bias = (count - 1) * 0.5;

  for (let i = 0; i < count; i += 1) {
    const y0 = (i - bias) * spacing;
    const points: THREE.Vector3[] = [];
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments;
      const x = xStart + t * (xEnd - xStart);
      const xNorm = (x / chord + 0.3) / 1.6;
      const influence = Math.exp(-Math.pow((xNorm - 0.25) / 0.55, 2));
      const bend = (alphaRad * 0.75 + camber * 1.4) * chord * influence;
      const leading = 0.08 * chord * Math.exp(-Math.pow((xNorm - 0.08) / 0.12, 2));
      const spread = clamp(1 - Math.abs(y0) / (0.9 * chord), 0, 1);
      const y = y0 + (bend + Math.sign(y0 || 1) * leading) * spread;
      points.push(toVec3(x, y));
    }
    lines.push(points);
  }

  return lines;
};

const clearStreamlines = (group: THREE.Group) => {
  group.children.forEach((child) => {
    if (child instanceof THREE.Line) {
      child.geometry.dispose();
      const material = child.material as THREE.Material;
      material.dispose();
    }
  });
  group.clear();
};

export const createAirfoilScene = (container: HTMLElement, getState: () => AirfoilState) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f14);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const airfoilLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf5f7fa })
  );
  const pressureUpper = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x45d07a })
  );
  const pressureLower = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x45d07a })
  );
  const shearUpper = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xe15249 })
  );
  const shearLower = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xe15249 })
  );

  const streamlineGroup = new THREE.Group();

  const liftArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0x6db7ff);
  const dragArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 1, 0xffa26b);

  const grid = new THREE.GridHelper(8, 24, 0x253243, 0x18202b);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.5;
  scene.add(grid);

  scene.add(airfoilLine, pressureUpper, pressureLower, shearUpper, shearLower, streamlineGroup, liftArrow, dragArrow);

  const resize = () => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const update = (state: AirfoilState) => {
    const rho = state.useAltitude ? densityAtAltitude(state.altitude) : state.rho;
    const chord = state.chord as number;
    const alphaRad = degToRad(state.alphaDeg);
    const cl = thinAirfoilLiftCoefficient(alphaRad as Radians);

    const airfoil = generateNaca4Airfoil({
      m: state.m,
      p: state.p,
      t: state.t,
      chord: state.chord,
      resolution: state.chordPoints,
    });

    const upperPoints = airfoil.upper.map((pt) => toVec3(pt.x as number, pt.y as number));
    const lowerPoints = airfoil.lower.map((pt) => toVec3(pt.x as number, pt.y as number));
    const outline = [...upperPoints, ...lowerPoints.slice().reverse()];
    updateLineGeometry(airfoilLine, outline);

    const normalsUpper = computeNormals(upperPoints, "upper");
    const normalsLower = computeNormals(lowerPoints, "lower");

    const q = dynamicPressure(rho, state.Vinf);
    const reChord = reynoldsNumberChord(rho, state.Vinf, state.chord, VISCOSITY_AIR);

    const pressureScale = PRESSURE_ENVELOPE_SCALE * chord;
    const shearScale = SHEAR_ENVELOPE_SCALE * chord;

    const pressureUpperPoints: THREE.Vector3[] = [];
    const pressureLowerPoints: THREE.Vector3[] = [];
    const shearUpperPoints: THREE.Vector3[] = [];
    const shearLowerPoints: THREE.Vector3[] = [];

    let maxShear = 0;
    upperPoints.forEach((point) => {
      const xOverC = (point.x / chord) as Dimensionless;
      const reX = reynoldsNumberAtX(rho, state.Vinf, point.x as Meters, VISCOSITY_AIR);
      const cf = state.laminar
        ? laminarSkinFrictionCoefficient(reX)
        : turbulentSkinFrictionCoefficient(reX);
      const tau = wallShearStress(q, cf) as number;
      maxShear = Math.max(maxShear, tau);
    });

    const shearNorm = maxShear === 0 ? 1 : maxShear;

    upperPoints.forEach((point, i) => {
      const xOverC = (point.x / chord) as Dimensionless;
      const cp = chordwisePressureCoefficient(xOverC, cl, state.m, "upper");
      const thickness = pressureScale * Math.abs(cp as number);
      const normal = normalsUpper[i] ?? new THREE.Vector3(0, 1, 0);
      pressureUpperPoints.push(point.clone().add(normal.clone().multiplyScalar(thickness)));

      const reX = reynoldsNumberAtX(rho, state.Vinf, point.x as Meters, VISCOSITY_AIR);
      const cf = state.laminar
        ? laminarSkinFrictionCoefficient(reX)
        : turbulentSkinFrictionCoefficient(reX);
      const tau = wallShearStress(q, cf) as number;
      const shearThickness = shearScale * (tau / shearNorm);
      shearUpperPoints.push(point.clone().add(normal.clone().multiplyScalar(shearThickness)));
    });

    lowerPoints.forEach((point, i) => {
      const xOverC = (point.x / chord) as Dimensionless;
      const cp = chordwisePressureCoefficient(xOverC, cl, state.m, "lower");
      const thickness = pressureScale * Math.abs(cp as number);
      const normal = normalsLower[i] ?? new THREE.Vector3(0, -1, 0);
      pressureLowerPoints.push(point.clone().add(normal.clone().multiplyScalar(thickness)));

      const reX = reynoldsNumberAtX(rho, state.Vinf, point.x as Meters, VISCOSITY_AIR);
      const cf = state.laminar
        ? laminarSkinFrictionCoefficient(reX)
        : turbulentSkinFrictionCoefficient(reX);
      const tau = wallShearStress(q, cf) as number;
      const shearThickness = shearScale * (tau / shearNorm);
      shearLowerPoints.push(point.clone().add(normal.clone().multiplyScalar(shearThickness)));
    });

    updateLineGeometry(pressureUpper, pressureUpperPoints);
    updateLineGeometry(pressureLower, pressureLowerPoints);
    updateLineGeometry(shearUpper, shearUpperPoints);
    updateLineGeometry(shearLower, shearLowerPoints);

    pressureUpper.visible = state.showPressure;
    pressureLower.visible = state.showPressure;
    shearUpper.visible = state.showShear;
    shearLower.visible = state.showShear;

    clearStreamlines(streamlineGroup);
    if (state.showStreamlines) {
      const streamlineSets = buildStreamlines(chord, alphaRad as number, state.m as number, state.streamlineCount);
      streamlineSets.forEach((linePoints) => {
        const line = new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({ color: 0x7bb0ff, transparent: true, opacity: 0.7 })
        );
        updateLineGeometry(line, linePoints);
        streamlineGroup.add(line);
      });
    }

    const cdF = skinFrictionDragCoefficient(reChord, state.laminar);
    const cdP = pressureDragCoefficient(cl, 0.008 as Dimensionless, 0.08 as Dimensionless);
    const cd = totalDragCoefficient(cdF, cdP);

    const area = (chord * 1) as SquareMeters; // unit span
    const liftN = (q as number) * (area as number) * (cl as number);
    const dragN = (q as number) * (area as number) * (cd as number);

    const forceScale = chord * 0.15;
    const liftDir = new THREE.Vector3(-Math.sin(alphaRad as number), Math.cos(alphaRad as number), 0).normalize();
    const dragDir = new THREE.Vector3(-Math.cos(alphaRad as number), -Math.sin(alphaRad as number), 0).normalize();

    const forceOrigin = new THREE.Vector3(0.25 * chord, 0, 0.05);
    liftArrow.position.copy(forceOrigin);
    liftArrow.setDirection(liftDir);
    liftArrow.setLength(clamp(liftN * 0.00008 + forceScale, 0.2 * chord, 0.9 * chord), 0.07 * chord, 0.04 * chord);

    dragArrow.position.copy(forceOrigin);
    dragArrow.setDirection(dragDir);
    dragArrow.setLength(clamp(dragN * 0.00008 + 0.5 * forceScale, 0.2 * chord, 0.9 * chord), 0.07 * chord, 0.04 * chord);

    const viewPadding = 1.4;
    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const halfHeight = viewPadding * chord;
    const halfWidth = halfHeight * aspect;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();

    airfoilLine.position.set(-0.05 * chord, 0, 0);
    pressureUpper.position.copy(airfoilLine.position);
    pressureLower.position.copy(airfoilLine.position);
    shearUpper.position.copy(airfoilLine.position);
    shearLower.position.copy(airfoilLine.position);
    streamlineGroup.position.copy(airfoilLine.position);

    renderer.render(scene, camera);

  };

  const animate = () => {
    renderer.render(scene, camera);
  };

  renderer.setAnimationLoop(animate);

  update(getState());

  return {
    update,
    dispose: () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      airfoilLine.geometry.dispose();
      pressureUpper.geometry.dispose();
      pressureLower.geometry.dispose();
      shearUpper.geometry.dispose();
      shearLower.geometry.dispose();
    },
  };
};
