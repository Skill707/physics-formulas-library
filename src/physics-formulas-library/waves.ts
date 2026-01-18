import type {
  Dimensionless,
  Hertz,
  Kilograms,
  Meters,
  MetersPerSecond,
  NewtonsPerMeter,
  NewtonSecondsPerMeter,
  RadiansPerSecond,
  Seconds,
} from "./types";

/** Angular frequency from spring constant and mass */
export function angularFrequencySpringMass(
  k: NewtonsPerMeter,
  mass: Kilograms
): RadiansPerSecond {
  return Math.sqrt((k / mass) as number) as RadiansPerSecond;
}

/** Natural frequency from angular frequency */
export function frequencyFromAngular(omega: RadiansPerSecond): Hertz {
  return (omega / (2 * Math.PI)) as Hertz;
}

/** Period from frequency */
export function periodFromFrequency(freq: Hertz): Seconds {
  return (1 / freq) as Seconds;
}

/** Damping ratio for mass-spring-damper */
export function dampingRatio(
  damping: NewtonSecondsPerMeter,
  mass: Kilograms,
  k: NewtonsPerMeter
): Dimensionless {
  const cCritical = 2 * Math.sqrt((k * mass) as number);
  return (damping / cCritical) as Dimensionless;
}

/** Damped natural frequency */
export function dampedAngularFrequency(
  omegaN: RadiansPerSecond,
  zeta: Dimensionless
): RadiansPerSecond {
  return (omegaN * Math.sqrt(1 - (zeta as number) * (zeta as number))) as RadiansPerSecond;
}

/** Wave speed from wavelength and frequency */
export function waveSpeed(
  wavelength: Meters,
  frequency: Hertz
): MetersPerSecond {
  return (wavelength * frequency) as MetersPerSecond;
}
