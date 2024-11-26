import { Level } from '../interfaces/level';
import { CastResult } from '../interfaces/raycaster';
import { Vector } from '../interfaces/vector';

import { Entity } from './entity.js';
import { CellType, Face } from '../enums.js';
import { levels } from '../data/levels/levels.js';
import { setCurrentLevel } from '../state.js';
import { isInteractive } from '../utils/cell-utils.js';
import { getCell } from '../utils/level-utils.js';
import * as vu from '../utils/vector-utils.js';

// FIXME: Slimmed down copy of the raycast function from raycaster.ts, should merge
function castRay(entity: Entity, level: Level, maxDepth: number = 50): CastResult | undefined {
  const direction = entity.direction;

  // Calculate the distance from one cell boundary to the next boundary in the X or Y direction.
  const deltaDistanceX = Math.abs(1 / entity.direction.x);
  const deltaDistanceY = Math.abs(1 / entity.direction.y);

  // Tracks the current Cell as the line is cast.s
  const castCell: Vector = { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y) };

  // Tracks the total distance from the ray's origin as the line is cast.
  const castDistance: Vector = vu.create();

  // Counts the steps along each axis as the line is cast.
  const castStep: Vector = vu.create();

  // Step to the next Cell on the X Axis.
  if (direction.x < 0) {
    castStep.x = -1;
    castDistance.x = (entity.position.x - castCell.x) * deltaDistanceX;
  } else {
    castStep.x = 1;
    castDistance.x = (castCell.x + 1 - entity.position.x) * deltaDistanceX;
  }

  // Step to the next Cell on the Y Axis.
  if (direction.y < 0) {
    castStep.y = -1;
    castDistance.y = (entity.position.y - castCell.y) * deltaDistanceY;
  } else {
    castStep.y = 1;
    castDistance.y = (castCell.y + 1 - entity.position.y) * deltaDistanceY;
  }

  // Count the number of DDA steps executed, so that we can break if the maximum depth is reached.
  let count = 0;

  // Tracks if the DDA step was in the X or the Y axis.
  let side;

  // Use DDA to step through all the cell boundaries the ray touches.
  while (count++ < maxDepth) {
    // Advance along either the X or the Y axis to the next Cell boundary.
    if (castDistance.x < castDistance.y) {
      castDistance.x += deltaDistanceX;
      castCell.x += castStep.x;
      side = castStep.x < 0 ? Face.EAST : Face.WEST;
    } else {
      castDistance.y += deltaDistanceY;
      castCell.y += castStep.y;
      side = castStep.y > 0 ? Face.NORTH : Face.SOUTH;
    }

    // Get the Cell that the ray has hit.
    const cell = getCell(level, castCell.x, castCell.y);

    // If the cell is not valid, then most likely exceeded the boundaries of the level hence give up.
    if (cell === undefined) {
      break;
    }

    // Check if the Cell is Solid.
    if (isInteractive(cell)) {
      // Calculate the distance from the ray's origin to the solid that was hit, and the specific point on the wall the ray hit.
      let distance = 0;
      let wall = 0;
      switch (side) {
        case Face.EAST:
        case Face.WEST:
          distance = Math.abs((castCell.x - entity.position.x + (1 - castStep.x) / 2) / direction.x);
          wall = entity.position.y + ((castCell.x - entity.position.x + (1 - castStep.x) / 2) / direction.x) * direction.y;
          wall -= Math.floor(wall);
          break;

        case Face.NORTH:
        case Face.SOUTH:
          distance = Math.abs((castCell.y - entity.position.y + (1 - castStep.y) / 2) / direction.y);
          wall = entity.position.x + ((castCell.y - entity.position.y + (1 - castStep.y) / 2) / direction.y) * direction.x;
          wall -= Math.floor(wall);
          break;
      }

      return {
        ...castCell,
        cell,
        face: side,
        wall,
        distance: distance
      };
    }
  }
  return undefined;
}

export class Player extends Entity {
  constructor(x: number, y: number) {
    super(x, y);
  }

  interact(level: Level): void {
    const result = castRay(this, level);
    if (result != undefined) {
      const cell = result.cell;
      const reach = 1 + this.radius;

      // Check we can reach the target.
      if (result.distance < reach) {
        // Target cell can be interacted with, and the specific face is stateful...
        if (isInteractive(cell)) {
          for (const activator of cell.activators) {
            activator(cell);
          }
        }

        // Target is an entrance...
        if (result.cell.type === CellType.ENTRANCE) {
          // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
          setTimeout(() => {
            const newLevel = level.entrance.destination ? levels[level.entrance.destination] : levels[level.depth - 1];
            setCurrentLevel(newLevel, newLevel.exit);
          }, 0);
        }

        // Target is an exit...
        if (result.cell.type === CellType.EXIT) {
          // FIXME: This is a temporary hack as this needs to be called outside of the animation loop.
          setTimeout(() => {
            const newLevel = level.exit.destination ? levels[level.exit.destination] : levels[level.depth + 1];
            setCurrentLevel(newLevel, newLevel.entrance);
          }, 0);
        }
      }
    }
  }
}
