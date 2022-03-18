// Returns a random number between the specified range.
export function getRandomInt(minimum: number, maximum: number): number {
  return Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
}

// Converts a value from Degrees to Radians.
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Converts a value from Radians to Degrees.
export function radiansToDegrees(degrees: number): number {
  return degrees * (180 / Math.PI);
}
