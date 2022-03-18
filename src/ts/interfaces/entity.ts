import { Circle } from './circle';

export interface Entity extends Circle {
  dx: number;
  dy: number;
  cx: number;
  cy: number;
  active: boolean;
  update(elapsed: number): void;
}
