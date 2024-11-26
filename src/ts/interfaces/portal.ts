import { Vector } from './vector';

export interface Portal extends Vector {
  angle: number;
  destination?: number;
}
