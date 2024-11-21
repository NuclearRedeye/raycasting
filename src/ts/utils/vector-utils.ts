import { Vector } from "../interfaces/vector";

export type Scaler = number;
export type Radian = number;

export function normalise(v: Vector): Vector {
  const magnitude = Math.sqrt((v.x * v.x) + (v.y * v.y));
  return {
    x: v.x / magnitude,
    y: v.y / magnitude
  }
}

export function add(a: Vector, b: Vector): Vector {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function subtract(a: Vector, b: Vector): Vector {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

export function rotate(v: Vector, radians: number): Vector {
  return {
    x: v.x * Math.cos(radians) - v.y * Math.sin(radians),
    y: v.x * Math.sin(radians) + v.y * Math.cos(radians)
  }
}

export function dot(a: Vector, b: Vector): Scaler {
  return (a.x * b.x) + (a.y * b.y);
}

export function angle(a: Vector, b?: Vector): Radian {
  if (b !== undefined) {
    return Math.acos(dot(a,b));
  }
  return Math.atan2(a.y, a.x);
}

