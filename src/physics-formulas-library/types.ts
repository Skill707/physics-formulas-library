type Meters = number;
type Seconds = number;
type MetersPerSecond = number;
type Radians = number;

export function acceleration(
  force: number,
  mass: number
): MetersPerSecond {
  return force / mass;
}

export function velocity(
  acceleration: MetersPerSecond,
  time: Seconds
): MetersPerSecond {
  return acceleration * time;
}

export function distance(
  velocity: MetersPerSecond,
  time: Seconds
): Meters {
  return velocity * time;
}

export function time(
  distance: Meters,
  velocity: MetersPerSecond
): Seconds {
  return distance / velocity;
}

export function angularVelocity(
  angularAcceleration: Radians,
  time: Seconds
): Radians {
  return angularAcceleration * time;
}

export function angularDisplacement(
  angularVelocity: Radians,
  time: Seconds
): Radians {
  return angularVelocity * time;
}