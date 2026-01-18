import { create } from "zustand";
import type {
  Degrees,
  Dimensionless,
  Meters,
  MetersPerSecond,
} from "./physics-formulas-library/types";

export type AirfoilState = {
  alphaDeg: Degrees;
  Vinf: MetersPerSecond;
  chord: Meters;
  m: Dimensionless;
  p: Dimensionless;
  t: Dimensionless;
  chordPoints: number;
  streamlineCount: number;
  showStreamlines: boolean;
};

export type AirfoilStore = AirfoilState & {
  set: (partial: Partial<AirfoilState>) => void;
};

export const useAirfoilStore = create<AirfoilStore>((set) => ({
  alphaDeg: 6 as Degrees,
  Vinf: 42 as MetersPerSecond,
  chord: 1.2 as Meters,
  m: 0.02 as Dimensionless,
  p: 0.4 as Dimensionless,
  t: 0.12 as Dimensionless,
  chordPoints: 140,
  streamlineCount: 12,
  showStreamlines: true,
  set: (partial) => set(partial),
}));
