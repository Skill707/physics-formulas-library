import * as THREE from "three";
import { degToRad } from "../physics-formulas-library/units";
import { solvePanelMethod, velocityAtPoint } from "../physics-formulas-library/aerodynamics";
import { buildAirfoilContour, generateNaca4Airfoil } from "../physics-formulas-library/geometry";
import type { AirfoilState } from "../store";
import type { Meters, Radians } from "../physics-formulas-library/types";

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
    if (speed < 1e-3) break;
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

  const streamlineGroup = new THREE.Group();
  scene.add(airfoilLine, streamlineGroup);

  const resize = () => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const update = (state: AirfoilState) => {
    const chord = state.chord as number;
    const alphaRad = degToRad(state.alphaDeg);

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

    clearStreamlines(streamlineGroup);
    if (state.showStreamlines) {
      const vAtPoint = (point: THREE.Vector2) =>
        velocityAtPoint(panelSolution, point.x as Meters, point.y as Meters, state.Vinf, alphaRad as Radians);
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
          new THREE.LineBasicMaterial({ color: 0xf5f7fa, transparent: true, opacity: 0.65 })
        );
        updateLineGeometry(line, linePoints);
        streamlineGroup.add(line);
      });
    }

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
    },
  };
};
