import { Cell } from '../interfaces/cell';

// Toogles the specified cells state between 0 and 1.
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
