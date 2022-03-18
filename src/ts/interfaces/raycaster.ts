import { Face } from '../enums';
import { Cell } from './cell';

export interface CastResult {
  x: number; // The X coordinate of the Cell.
  y: number; // The Y coordinate of the Cell.
  cell: Cell; // The Cell that was hit.
  face: Face; // The specific side of the cell the ray hit.
  wall: number; // The specific coordinates on the face that the ray hit.
  distance: number; // The distance to the wall from the point of origin.
}
