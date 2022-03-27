import { Cell } from '../interfaces/cell';

import { registerTimer } from './timer-utils.js';

// Toggles the specified cells state between 0 and 1.
export function activatorToggle(cell: Cell): void {
  cell.state = cell.state === 0 ? 1 : 0;
}

// Increments the specified cells state by 1.
export function activatorIncrement(cell: Cell): void {
  cell.state += 1;
}

// Decrements the specified cells state by 1.
export function activatorDecrement(cell: Cell): void {
  cell.state += 1;
}

// Updates a cells state over a defined period of time.
export function activatorDoor(cell: Cell): void {
  // FIXME:
  // - id should be unique
  // - door opening/closing speed should be configurable
  // - should not use state, as prevents door texture from being animated
  if (cell.state === 0) {
    // Register a new timer to CLOSE the door
    registerTimer('testDoor', (delta: number): boolean => {
      cell.state += (100 / 800) * delta;
      cell.state = Math.min(cell.state, 100);
      return cell.state >= 100;
    });
  } else if (cell.state === 100) {
    // Register a new timer to OPEN the door
    registerTimer('testDoor', (delta: number): boolean => {
      cell.state -= (100 / 800) * delta;
      cell.state = Math.max(cell.state, 0);
      return cell.state <= 0;
    });
  }
}
