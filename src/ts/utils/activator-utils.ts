import { Cell, DoorCell } from '../interfaces/cell';

import { DoorState } from '../enums.js';
import { isDoor } from './cell-utils.js';
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

// Registers a timer to open or close the door over a defined period of time.
export function activatorDoor(cell: Cell): void {
  if (isDoor(cell)) {
    const door = cell as DoorCell;

    switch (door.status) {
      case DoorState.OPEN:
      case DoorState.OPENING:
        door.status = DoorState.CLOSING;
        registerTimer(door.id, (delta: number): boolean => {
          door.percent += (100 / door.speed) * delta;
          door.percent = Math.min(door.percent, 100);
          if (door.percent === 100) {
            door.status = DoorState.CLOSED;
          }
          return door.status === DoorState.CLOSED;
        });
        break;

      case DoorState.CLOSED:
      case DoorState.CLOSING:
        door.status = DoorState.OPENING;
        registerTimer(door.id, (delta: number): boolean => {
          door.percent -= (100 / door.speed) * delta;
          door.percent = Math.max(door.percent, 0);
          if (door.percent === 0) {
            door.status = DoorState.OPEN;
          }
          return door.status === DoorState.OPEN;
        });
        break;
    }
  }
}
