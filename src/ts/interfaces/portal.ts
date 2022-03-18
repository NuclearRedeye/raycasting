import { Point } from './point';

export interface Portal extends Point {
  angle: number;
  destination?: number;
}
