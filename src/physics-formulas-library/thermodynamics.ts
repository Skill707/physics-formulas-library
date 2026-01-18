import type {
  Dimensionless,
  Joules,
  JoulesPerKilogramKelvin,
  Kelvin,
  Kilograms,
  Pascals,
  Seconds,
  Watts,
  CubicMeters,
} from "./types";

/** Ideal gas law: pressure from mass, temperature, and specific gas constant */
export function idealGasPressure(
  mass: Kilograms,
  specificGasConstant: JoulesPerKilogramKelvin,
  temperature: Kelvin,
  volume: CubicMeters
): Pascals {
  return ((mass * specificGasConstant * temperature) / volume) as Pascals;
}

/** Ideal gas law: temperature from pressure, mass, and specific gas constant */
export function idealGasTemperature(
  pressure: Pascals,
  mass: Kilograms,
  specificGasConstant: JoulesPerKilogramKelvin,
  volume: CubicMeters
): Kelvin {
  return ((pressure * volume) / (mass * specificGasConstant)) as Kelvin;
}

/** Ideal gas law: volume from pressure, mass, and specific gas constant */
export function idealGasVolume(
  pressure: Pascals,
  mass: Kilograms,
  specificGasConstant: JoulesPerKilogramKelvin,
  temperature: Kelvin
): CubicMeters {
  return ((mass * specificGasConstant * temperature) / pressure) as CubicMeters;
}

/** Isothermal process: P1 * V1 = P2 * V2 */
export function isothermalPressure(
  p1: Pascals,
  v1: CubicMeters,
  v2: CubicMeters
): Pascals {
  return ((p1 * v1) / v2) as Pascals;
}

/** Adiabatic process: P1 * V1^gamma = P2 * V2^gamma */
export function adiabaticPressure(
  p1: Pascals,
  v1: CubicMeters,
  v2: CubicMeters,
  gamma: Dimensionless
): Pascals {
  return (p1 * Math.pow(v1 / v2, gamma as number)) as Pascals;
}

/** Adiabatic temperature ratio: T2/T1 = (P2/P1)^((gamma-1)/gamma) */
export function adiabaticTemperatureRatio(
  p2OverP1: Dimensionless,
  gamma: Dimensionless
): Dimensionless {
  return Math.pow(p2OverP1 as number, ((gamma - 1) / gamma) as number) as Dimensionless;
}

/** Internal energy change: deltaU = m * cv * deltaT */
export function internalEnergyChange(
  mass: Kilograms,
  cv: JoulesPerKilogramKelvin,
  deltaT: Kelvin
): Joules {
  return (mass * cv * deltaT) as Joules;
}

/** Heat transfer: Q = m * c * deltaT */
export function heatTransfer(
  mass: Kilograms,
  c: JoulesPerKilogramKelvin,
  deltaT: Kelvin
): Joules {
  return (mass * c * deltaT) as Joules;
}

/** Thermal power from heat transfer */
export function thermalPower(heat: Joules, time: Seconds): Watts {
  return (heat / time) as Watts;
}
