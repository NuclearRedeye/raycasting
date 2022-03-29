import { Point } from './interfaces/point';
import { Rectangle } from './interfaces/rectangle';

// Supported resolutions for the Back Buffer, lower resolutions yield better performance.
const resolutions: Point[] = [
  { x: 160, y: 120 },
  { x: 320, y: 240 },
  { x: 480, y: 460 },
  { x: 640, y: 480 },
  { x: 800, y: 600 }
];

// Current resolution of the Back Buffer, defaults to 640x480.
let currentResolution = 3;

export const backBufferProps: Rectangle = {
  x: 0,
  y: 0,
  width: 640,
  height: 480
};

// Increases the resolution of the Back Buffer by 1, until the maximum supported resolution is reached.
export function increaseBackBufferSize(): boolean {
  if (currentResolution + 1 >= resolutions.length) {
    return false;
  }
  currentResolution += 1;
  backBufferProps.width = resolutions[currentResolution].x;
  backBufferProps.height = resolutions[currentResolution].y;
  return true;
}

// Decreases the resolution of the Back Buffer by 1, until the lowest supported resolution is reached.
export function decreaseBackBufferSize(): boolean {
  if (currentResolution - 1 < 0) {
    return false;
  }
  currentResolution -= 1;
  backBufferProps.width = resolutions[currentResolution].x;
  backBufferProps.height = resolutions[currentResolution].y;
  return true;
}
