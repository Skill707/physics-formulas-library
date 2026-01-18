import type {
  Kelvin,
  KilogramsPerCubicMeter,
  Meters,
  MetersPerSecond,
  Pascals,
} from "./types";
import { G0, LAPSE_TROPOSPHERE, P0, R_AIR, T0, GAMMA_AIR } from "./constants";

/** Temperature at altitude (troposphere ISA) */
export function temperatureAtAltitude(altitude: Meters): Kelvin {
  return (T0 - LAPSE_TROPOSPHERE * altitude) as Kelvin;
}

/** Pressure at altitude (troposphere ISA) */
export function pressureAtAltitude(altitude: Meters): Pascals {
  const T = temperatureAtAltitude(altitude);
  const exponent = (G0 / (R_AIR * LAPSE_TROPOSPHERE)) as number;
  return (P0 * Math.pow(T / T0, exponent)) as Pascals;
}

/** Density at altitude (troposphere ISA) */
export function densityAtAltitude(altitude: Meters): KilogramsPerCubicMeter {
  const p = pressureAtAltitude(altitude);
  const T = temperatureAtAltitude(altitude);
  return (p / (R_AIR * T)) as KilogramsPerCubicMeter;
}

/** Speed of sound from temperature */
export function speedOfSound(temperature: Kelvin): MetersPerSecond {
  return Math.sqrt((GAMMA_AIR * R_AIR * temperature) as number) as MetersPerSecond;
}

/** Air density from pressure and temperature */
export function densityFromPressureTemperature(
  pressure: Pascals,
  temperature: Kelvin
): KilogramsPerCubicMeter {
  return (pressure / (R_AIR * temperature)) as KilogramsPerCubicMeter;
}

/** Pressure from density and temperature */
export function pressureFromDensityTemperature(
  density: KilogramsPerCubicMeter,
  temperature: Kelvin
): Pascals {
  return (density * R_AIR * temperature) as Pascals;
}

/** Temperature from pressure and density */
export function temperatureFromPressureDensity(
  pressure: Pascals,
  density: KilogramsPerCubicMeter
): Kelvin {
  return (pressure / (R_AIR * density)) as Kelvin;
}
