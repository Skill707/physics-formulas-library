import type {
  Dimensionless,
  JoulesPerKilogramKelvin,
  Kelvin,
  KelvinPerMeter,
  KilogramsPerCubicMeter,
  MetersPerSecond,
  MetersPerSecondSq,
  Pascals,
  GravitationalConstant,
} from "./types";

/** Standard gravity at sea level */
export const G0 = 9.80665 as MetersPerSecondSq;
/** Universal gravitational constant */
export const BIG_G = 6.6743e-11 as GravitationalConstant;
/** Sea level standard atmospheric density */
export const RHO0 = 1.225 as KilogramsPerCubicMeter;
/** Sea level standard atmospheric pressure */
export const P0 = 101325 as Pascals;
/** Sea level standard temperature */
export const T0 = 288.15 as Kelvin;
/** Temperature lapse rate in troposphere */
export const LAPSE_TROPOSPHERE = 0.0065 as KelvinPerMeter;
/** Specific gas constant for dry air */
export const R_AIR = 287.05 as JoulesPerKilogramKelvin;
/** Heat capacity ratio for dry air */
export const GAMMA_AIR = 1.4 as Dimensionless;
/** Speed of sound at sea level */
export const A0 = 340.294 as MetersPerSecond;
/** Unit conversion constants */
export const RAD2DEG = (180 / Math.PI) as Dimensionless;
export const DEG2RAD = (Math.PI / 180) as Dimensionless;
