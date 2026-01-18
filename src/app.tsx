import { useEffect, useMemo, useRef } from "react";
import { useAirfoilStore } from "./store";
import { createAirfoilScene } from "./visualization/airfoilScene";
import {
  dynamicPressure,
  pressureDragCoefficient,
  reynoldsNumberChord,
  skinFrictionDragCoefficient,
  thinAirfoilLiftCoefficient,
  totalDragCoefficient,
} from "./physics-formulas-library/aerodynamics";
import { densityAtAltitude } from "./physics-formulas-library/atmosphere";
import { degToRad } from "./physics-formulas-library/units";
import type {
  Degrees,
  Dimensionless,
  KilogramsPerCubicMeter,
  Meters,
  MetersPerSecond,
  PascalsSecond,
  Radians,
  SquareMeters,
} from "./physics-formulas-library/types";

const VISCOSITY_AIR = 1.81e-5 as PascalsSecond;

export const App = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const state = useAirfoilStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = createAirfoilScene(containerRef.current, useAirfoilStore.getState);
    const unsub = useAirfoilStore.subscribe((s) => scene.update(s));
    return () => {
      unsub();
      scene.dispose();
    };
  }, []);

  const metrics = useMemo(() => {
    const rho = state.useAltitude ? densityAtAltitude(state.altitude) : state.rho;
    const alphaRad = degToRad(state.alphaDeg) as Radians;
    const cl = thinAirfoilLiftCoefficient(alphaRad);
    const q = dynamicPressure(rho, state.Vinf);
    const reChord = reynoldsNumberChord(rho, state.Vinf, state.chord, VISCOSITY_AIR);
    const cdF = skinFrictionDragCoefficient(reChord, state.laminar);
    const cdP = pressureDragCoefficient(cl, 0.008 as Dimensionless, 0.08 as Dimensionless);
    const cd = totalDragCoefficient(cdF, cdP);
    const area = (state.chord as number) as SquareMeters;
    const liftN = (q as number) * (area as number) * (cl as number);
    const dragN = (q as number) * (area as number) * (cd as number);

    return {
      rho,
      cl,
      cd,
      q,
      reChord,
      liftN,
      dragN,
    };
  }, [state]);

  const set = state.set;

  const format = (value: number, digits = 2) => value.toFixed(digits);

  return (
    <div className="app">
      <div className="panel">
        <header>
          <div className="title">Airfoil Flow Atlas</div>
          <div className="subtitle">Procedural NACA 4-digit visualization</div>
        </header>

        <section className="group">
          <h3>Flow</h3>
          <label>
            <span>Angle of attack</span>
            <input
              type="range"
              min={-10}
              max={16}
              step={0.1}
              value={state.alphaDeg as number}
              onChange={(e) => set({ alphaDeg: Number(e.target.value) as Degrees })}
            />
            <output>{format(state.alphaDeg as number, 1)} deg</output>
          </label>
          <label>
            <span>Freestream speed</span>
            <input
              type="range"
              min={8}
              max={80}
              step={0.5}
              value={state.Vinf as number}
              onChange={(e) => set({ Vinf: Number(e.target.value) as MetersPerSecond })}
            />
            <output>{format(state.Vinf as number, 1)} m/s</output>
          </label>
          <label>
            <span>Chord length</span>
            <input
              type="range"
              min={0.6}
              max={2}
              step={0.05}
              value={state.chord as number}
              onChange={(e) => set({ chord: Number(e.target.value) as Meters })}
            />
            <output>{format(state.chord as number, 2)} m</output>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.laminar}
              onChange={(e) => set({ laminar: e.target.checked })}
            />
            <span>Laminar boundary layer</span>
          </label>
        </section>

        <section className="group">
          <h3>Atmosphere</h3>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.useAltitude}
              onChange={(e) => set({ useAltitude: e.target.checked })}
            />
            <span>Use ISA density</span>
          </label>
          <label>
            <span>Altitude</span>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={state.altitude as number}
              onChange={(e) => set({ altitude: Number(e.target.value) as Meters })}
              disabled={!state.useAltitude}
            />
            <output>{format(state.altitude as number, 0)} m</output>
          </label>
          <label>
            <span>Density</span>
            <input
              type="range"
              min={0.4}
              max={1.4}
              step={0.01}
              value={state.rho as number}
              onChange={(e) => set({ rho: Number(e.target.value) as KilogramsPerCubicMeter })}
              disabled={state.useAltitude}
            />
            <output>{format((metrics.rho as number) ?? (state.rho as number), 3)} kg/m^3</output>
          </label>
        </section>

        <section className="group">
          <h3>Airfoil</h3>
          <label>
            <span>Max camber m</span>
            <input
              type="range"
              min={0}
              max={0.08}
              step={0.005}
              value={state.m as number}
              onChange={(e) => set({ m: Number(e.target.value) as Dimensionless })}
            />
            <output>{format(state.m as number, 3)}</output>
          </label>
          <label>
            <span>Camber location p</span>
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.01}
              value={state.p as number}
              onChange={(e) => set({ p: Number(e.target.value) as Dimensionless })}
            />
            <output>{format(state.p as number, 2)}</output>
          </label>
          <label>
            <span>Thickness t</span>
            <input
              type="range"
              min={0.06}
              max={0.18}
              step={0.005}
              value={state.t as number}
              onChange={(e) => set({ t: Number(e.target.value) as Dimensionless })}
            />
            <output>{format(state.t as number, 3)}</output>
          </label>
          <label>
            <span>Chord points</span>
            <input
              type="range"
              min={60}
              max={240}
              step={10}
              value={state.chordPoints}
              onChange={(e) => set({ chordPoints: Number(e.target.value) })}
            />
            <output>{state.chordPoints}</output>
          </label>
        </section>

        <section className="group">
          <h3>Layers</h3>
          <label>
            <span>Streamlines</span>
            <input
              type="range"
              min={6}
              max={20}
              step={1}
              value={state.streamlineCount}
              onChange={(e) => set({ streamlineCount: Number(e.target.value) })}
            />
            <output>{state.streamlineCount}</output>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.showStreamlines}
              onChange={(e) => set({ showStreamlines: e.target.checked })}
            />
            <span>Show streamlines</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.showPressure}
              onChange={(e) => set({ showPressure: e.target.checked })}
            />
            <span>Show pressure envelope</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.showShear}
              onChange={(e) => set({ showShear: e.target.checked })}
            />
            <span>Show shear envelope</span>
          </label>
        </section>

        <section className="group stats">
          <h3>Forces</h3>
          <div className="stat">
            <span>CL</span>
            <strong>{format(metrics.cl as number, 3)}</strong>
          </div>
          <div className="stat">
            <span>CD</span>
            <strong>{format(metrics.cd as number, 4)}</strong>
          </div>
          <div className="stat">
            <span>q</span>
            <strong>{format(metrics.q as number, 1)} Pa</strong>
          </div>
          <div className="stat">
            <span>Re_c</span>
            <strong>{format(metrics.reChord as number, 0)}</strong>
          </div>
          <div className="stat">
            <span>Lift</span>
            <strong>{format(metrics.liftN, 1)} N</strong>
          </div>
          <div className="stat">
            <span>Drag</span>
            <strong>{format(metrics.dragN, 1)} N</strong>
          </div>
        </section>
      </div>

      <div className="stage">
        <div className="canvas" ref={containerRef} />
        <div className="legend">
          <span className="pill pressure">Pressure envelope</span>
          <span className="pill shear">Shear envelope</span>
          <span className="pill flow">Streamlines</span>
          <span className="pill forces">Lift & Drag</span>
        </div>
      </div>
    </div>
  );
};