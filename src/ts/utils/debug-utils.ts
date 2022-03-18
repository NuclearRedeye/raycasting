import { CastResult } from '../interfaces/raycaster';

import { Face } from '../enums.js';

// Function that gets a string representation of the specified Face
export function faceToString(face: Face): string {
  let retVal: string;
  switch (face) {
    case Face.NORTH:
      retVal = 'North';
      break;
    case Face.SOUTH:
      retVal = 'South';
      break;
    case Face.EAST:
      retVal = 'East';
      break;
    case Face.WEST:
      retVal = 'West';
      break;
    case Face.TOP:
      retVal = 'Ceiling';
      break;
    case Face.BOTTOM:
      retVal = 'Floor';
      break;
  }
  return retVal;
}

// Function to dump a CastResult to the console
export function dumpCastResult(result: CastResult): void {
  console.log(`CastResult:`);
  console.log(`- Cell = (${result.x}, ${result.y})`);
  console.log(`- Face = ${faceToString(result.face)}`);
  console.log(`- Distance = ${result.distance}`);
}
