export function maxPitchRateG(
  gLimit: number,
  tas: number
) {
  return ((gLimit * 9.81) / tas) * (180 / Math.PI);
}
