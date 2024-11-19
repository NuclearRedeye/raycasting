import { Rectangle } from './interfaces/rectangle';

// Supported resolutions for the Back Buffer, lower resolutions yield better performance.
const supportedResolutions: Rectangle[] = [
  { x: 0, y: 0, width: 160, height: 120 },
  { x: 0, y: 0, width: 320, height: 240 },
  { x: 0, y: 0, width: 480, height: 360 },
  { x: 0, y: 0, width: 640, height: 480 },
  { x: 0, y: 0, width: 800, height: 600 }
];

// Current resolution of the Back Buffer, defaults to 640x480.
let currentResolution = 3;
export let backBufferProps: Rectangle = supportedResolutions[currentResolution];

// Increases the resolution of the Back Buffer by 1, until the maximum supported resolution is reached.
export function increaseBackBufferSize(): boolean {
  if (currentResolution + 1 >= supportedResolutions.length) {
    return false;
  }
  currentResolution += 1;
  backBufferProps = supportedResolutions[currentResolution];
  return true;
}

// Decreases the resolution of the Back Buffer by 1, until the lowest supported resolution is reached.
export function decreaseBackBufferSize(): boolean {
  if (currentResolution - 1 < 0) {
    return false;
  }
  currentResolution -= 1;
  backBufferProps = supportedResolutions[currentResolution];
  return true;
}
