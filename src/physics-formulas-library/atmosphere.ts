export function airDensity(alt: number): number {
  return 1.225 * Math.exp(-alt / 8500);
}
