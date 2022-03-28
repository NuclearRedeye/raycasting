import { Activator } from './activator';
import { CellProperties, CellType, DoorState } from '../enums';

export interface Cell {
  id: string; // unique identifier for the cell.
  type: CellType;
  textureIds: number[];
  properties: CellProperties; // Flags to store any special properties of the cell.
  activators: Activator[];
  state: number;
}

export interface DoorCell extends Cell {
  status: DoorState; // The doors current state, e.g. Opening, Closed, etc.
  percent: number; // The amount, in percent, the door is closed. 100 mean closed, 0 means open.
  speed: number; // The time, in milliseconds, the door takes to open or close.
}
