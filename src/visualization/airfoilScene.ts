import * as THREE from "three";
import { degToRad } from "../physics-formulas-library/units";
import {
  dynamicPressure,
  laminarSkinFrictionCoefficient,
  pressureDragCoefficient,
  reynoldsNumberAtX,
  reynoldsNumberChord,
  solvePanelMethod,
  skinFrictionDragCoefficient,
  thinAirfoilLiftCoefficient,
  totalDragCoefficient,
  turbulentSkinFrictionCoefficient,
  velocityFromPanels,
  wallShearStress,
} from "../physics-formulas-library/aerodynamics";
import { densityAtAltitude } from "../physics-formulas-library/atmosphere";
import { buildAirfoilContour, generateNaca4Airfoil } from "../physics-formulas-library/geometry";
import type { AirfoilState } from "../store";
import type {
  Dimensionless,
  Meters,
  MetersPerSecond,
  PascalsSecond,
  Pascals,
  Radians,
  SquareMeters,
} from "../physics-formulas-library/types";

const VISCOSITY_AIR = 1.81e-5 as PascalsSecond;
const PRESSURE_ENVELOPE_SCALE = 0.08;
const SHEAR_ENVELOPE_SCALE = 0.05;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toVec3 = (x: number, y: number): THREE.Vector3 => new THREE.Vector3(x, y, 0);
const toVec2 = (x: number, y: number): THREE.Vector2 => new THREE.Vector2(x, y);

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

const integrateStreamline = (
  seed: THREE.Vector2,
  velocityAt: (point: THREE.Vector2) => THREE.Vector2,
  chord: number
): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  let p = seed.clone();
  const step = 0.03 * chord;
  const maxSteps = 380;
  const bounds = 1.6 * chord;

  for (let i = 0; i < maxSteps; i += 1) {
    const v1 = velocityAt(p);
    const speed = Math.max(1e-5, v1.length());
    const k1 = v1.clone().divideScalar(speed).multiplyScalar(step);
    const v2 = velocityAt(p.clone().addScaledVector(k1, 0.5));
    const speed2 = Math.max(1e-5, v2.length());
    const k2 = v2.clone().divideScalar(speed2).multiplyScalar(step);
    const v3 = velocityAt(p.clone().addScaledVector(k2, 0.5));
    const speed3 = Math.max(1e-5, v3.length());
    const k3 = v3.clone().divideScalar(speed3).multiplyScalar(step);
    const v4 = velocityAt(p.clone().add(k3));
    const speed4 = Math.max(1e-5, v4.length());
    const k4 = v4.clone().divideScalar(speed4).multiplyScalar(step);

    const delta = k1
      .clone()
      .addScaledVector(k2, 2)
      .addScaledVector(k3, 2)
      .add(k4)
      .multiplyScalar(1 / 6);
    p = p.add(delta);
    points.push(toVec3(p.x, p.y));

    if (p.x > 1.6 * chord || Math.abs(p.y) > bounds || p.x < -0.8 * chord) break;
  }

  return points;
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

    const contour = buildAirfoilContour(airfoil);
    const panelSolution = solvePanelMethod(contour, state.Vinf, alphaRad as Radians);

    const q = dynamicPressure(rho, state.Vinf);
    const reChord = reynoldsNumberChord(rho, state.Vinf, state.chord, VISCOSITY_AIR);

    const pressureScale = PRESSURE_ENVELOPE_SCALE * chord;
    const shearScale = SHEAR_ENVELOPE_SCALE * chord;

    const pressureUpperPoints: THREE.Vector3[] = [];
    const pressureLowerPoints: THREE.Vector3[] = [];
    const shearUpperPoints: THREE.Vector3[] = [];
    const shearLowerPoints: THREE.Vector3[] = [];

    let maxShear = 0;
    panelSolution.panels.forEach((panel, i) => {
      const xCoord = clamp(panel.control.x, 0, chord) as Meters;
      const vt = panelSolution.vt[i] as number;
      const localSpeed = Math.max(0.1, Math.abs(vt));
      const reX = reynoldsNumberAtX(rho, localSpeed as MetersPerSecond, xCoord, VISCOSITY_AIR);
      const cf = state.laminar
        ? laminarSkinFrictionCoefficient(reX)
        : turbulentSkinFrictionCoefficient(reX);
      const qLocal = (0.5 * (rho as number) * localSpeed * localSpeed) as Pascals;
      const tau = wallShearStress(qLocal, cf) as number;
      maxShear = Math.max(maxShear, tau);
    });

    const shearNorm = maxShear === 0 ? 1 : maxShear;

    panelSolution.panels.forEach((panel, i) => {
      const cp = panelSolution.cp[i] as number;
      const thickness = pressureScale * Math.abs(cp);
      const offset = new THREE.Vector3(panel.normal.x, panel.normal.y, 0).multiplyScalar(thickness);
      const point = toVec3(panel.control.x, panel.control.y).add(offset);
      if (panel.control.y >= 0) {
        pressureUpperPoints.push(point);
      } else {
        pressureLowerPoints.push(point);
      }

      const vt = panelSolution.vt[i] as number;
      const localSpeed = Math.max(0.1, Math.abs(vt));
      const xCoord = clamp(panel.control.x, 0, chord) as Meters;
      const reX = reynoldsNumberAtX(rho, localSpeed as MetersPerSecond, xCoord, VISCOSITY_AIR);
      const cf = state.laminar
        ? laminarSkinFrictionCoefficient(reX)
        : turbulentSkinFrictionCoefficient(reX);
      const qLocal = (0.5 * (rho as number) * localSpeed * localSpeed) as Pascals;
      const tau = wallShearStress(qLocal, cf) as number;
      const shearThickness = shearScale * (tau / shearNorm);
      const shearOffset = new THREE.Vector3(panel.normal.x, panel.normal.y, 0).multiplyScalar(shearThickness);
      const shearPoint = toVec3(panel.control.x, panel.control.y).add(shearOffset);
      if (panel.control.y >= 0) {
        shearUpperPoints.push(shearPoint);
      } else {
        shearLowerPoints.push(shearPoint);
      }
    });

    pressureUpperPoints.sort((a, b) => a.x - b.x);
    pressureLowerPoints.sort((a, b) => b.x - a.x);
    shearUpperPoints.sort((a, b) => a.x - b.x);
    shearLowerPoints.sort((a, b) => b.x - a.x);

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
      const vAtPoint = (point: THREE.Vector2) =>
        velocityFromPanels(panelSolution, point, state.Vinf, alphaRad as Radians);
      const seeds: THREE.Vector2[] = [];
      const spacing = (1.6 * chord) / Math.max(1, state.streamlineCount - 1);
      const bias = (state.streamlineCount - 1) * 0.5;
      for (let i = 0; i < state.streamlineCount; i += 1) {
        seeds.push(toVec2(-0.6 * chord, (i - bias) * spacing));
      }
      const streamlineSets = seeds.map((seed) => integrateStreamline(seed, vAtPoint, chord));
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
