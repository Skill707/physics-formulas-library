export function lift(
  rho: number,
  v: number,
  S: number,
  Cl: number
) {
  return 0.5 * rho * v * v * S * Cl;
}

export function drag(
  rho: number,
  v: number,
  S: number,
  Cd: number
) {
  return 0.5 * rho * v * v * S * Cd;
}
