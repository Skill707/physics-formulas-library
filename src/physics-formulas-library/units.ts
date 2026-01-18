import type {
  Degrees,
  Dimensionless,
  Feet,
  Kilometers,
  Knots,
  Meters,
  MetersPerSecond,
  NauticalMiles,
  Radians,
} from "./types";

/** Degree to radian conversion factor */
export const DEG2RAD = (Math.PI / 180) as Dimensionless;
/** Radian to degree conversion factor */
export const RAD2DEG = (180 / Math.PI) as Dimensionless;

export const degToRad = (deg: Degrees): Radians => (deg * DEG2RAD) as Radians;

export const radToDeg = (rad: Radians): Degrees => (rad * RAD2DEG) as Degrees;

/** Convert kilometers to meters */
export const kmToM = (km: Kilometers): Meters => (km * 1000) as Meters;

/** Convert meters to kilometers */
export const mToKm = (m: Meters): Kilometers => (m / 1000) as Kilometers;

/** Convert feet to meters */
export const ftToM = (ft: Feet): Meters => (ft * 0.3048) as Meters;

/** Convert meters to feet */
export const mToFt = (m: Meters): Feet => (m / 0.3048) as Feet;

/** Convert nautical miles to meters */
export const nmiToM = (nmi: NauticalMiles): Meters => (nmi * 1852) as Meters;

/** Convert meters to nautical miles */
export const mToNmi = (m: Meters): NauticalMiles => (m / 1852) as NauticalMiles;

/** Convert knots to meters per second */
export const ktToMps = (kt: Knots): MetersPerSecond => (kt * 0.514444) as MetersPerSecond;

/** Convert meters per second to knots */
export const mpsToKt = (mps: MetersPerSecond): Knots => (mps / 0.514444) as Knots;
