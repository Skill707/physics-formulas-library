import { create } from "zustand";
import type {
  Degrees,
  Dimensionless,
  KilogramsPerCubicMeter,
  Meters,
  MetersPerSecond,
} from "./physics-formulas-library/types";

export type AirfoilState = {
  alphaDeg: Degrees;
  Vinf: MetersPerSecond;
  rho: KilogramsPerCubicMeter;
  altitude: Meters;
  useAltitude: boolean;
  chord: Meters;
  m: Dimensionless;
  p: Dimensionless;
  t: Dimensionless;
  laminar: boolean;
  chordPoints: number;
  streamlineCount: number;
  showPressure: boolean;
  showShear: boolean;
  showStreamlines: boolean;
};

export type AirfoilStore = AirfoilState & {
  set: (partial: Partial<AirfoilState>) => void;
};

export const useAirfoilStore = create<AirfoilStore>((set) => ({
  alphaDeg: 6 as Degrees,
  Vinf: 42 as MetersPerSecond,
  rho: 1.225 as KilogramsPerCubicMeter,
  altitude: 0 as Meters,
  useAltitude: true,
  chord: 1.2 as Meters,
  m: 0.02 as Dimensionless,
  p: 0.4 as Dimensionless,
  t: 0.12 as Dimensionless,
  laminar: true,
  chordPoints: 140,
  streamlineCount: 12,
  showPressure: true,
  showShear: true,
  showStreamlines: true,
  set: (partial) => set(partial),
}));