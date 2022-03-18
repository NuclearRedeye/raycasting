import { Activator } from './activator';
import { CellProperties, CellType } from '../enums';

export interface Cell {
  type: CellType;
  textureIds: number[];
  properties: CellProperties; // Flags to store any special properties of the cell.
  activators: Activator[];
  state: number;
}
