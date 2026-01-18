import { useEffect, useRef } from "react";
import { useAirfoilStore } from "./store";
import { createAirfoilScene } from "./visualization/airfoilScene";
import type {
  Degrees,
  Dimensionless,
  Meters,
  MetersPerSecond,
} from "./physics-formulas-library/types";

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
          <h3>Streamlines</h3>
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
        </section>
      </div>

      <div className="stage">
        <div className="canvas" ref={containerRef} />
      </div>
    </div>
  );
};
