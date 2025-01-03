import { Activator } from '../interfaces/activator';
import { Cell, DoorCell } from '../interfaces/cell';

import { CellProperties, CellType, DoorState, Face } from '../enums.js';
import { getTextureById } from './texture-utils.js';
import { Texture } from '../interfaces/texture.js';
import { activatorIncrement, activatorToggle, activatorDoor } from './activator-utils.js';

let id = 0;

// Generic function to create a Cell.
function createCell(type: CellType, textureIds: number[], properties: number = 0): Cell {
  return {
    id: `cell-${id++}`,
    type,
    textureIds,
    properties,
    activators: [],
    state: 0
  };
}

// Checks if the specified cell has the specified property.
function cellHasProperty(cell: Cell, property: CellProperties): number {
  return cell.properties & property;
}

// Utility function to determine if the specified cell is solid.
export function isSolid(cell: Cell): number {
  let retVal = cellHasProperty(cell, CellProperties.SOLID);

  // FIXME: This should be moved elsewhere as in specific walls of a 'Door' Cell could still be solid
  if (isDoor(cell) && (cell as DoorCell).status === DoorState.OPEN) {
    retVal = 0;
  }
  return retVal;
}

// Utility function to determine if the specified cell is blocked.
export function isBlocked(cell: Cell): number {
  let retVal = cellHasProperty(cell, CellProperties.BLOCKED);

  // FIXME: This should be moved elsewhere as in specific walls of a 'Door' Cell could still be solid
  if (isDoor(cell) && (cell as DoorCell).status === DoorState.OPEN) {
    retVal = 0;
  }
  return retVal;
}

// Utility function to determine if the specified cell is solid.
export function isInteractive(cell: Cell): number {
  return cellHasProperty(cell, CellProperties.INTERACTIVE);
}

// Utility function to determine if the specified cell is thin.
export function isThin(cell: Cell): number {
  return cellHasProperty(cell, CellProperties.THIN);
}

// Utility function to determine if the specified cell is thin.
export function isDoor(cell: Cell): boolean {
  return cell.type === CellType.DOOR;
}

// Utility function to get the texture ID for the specific face in the specified cell.
export function getTexture(cell: Cell, face: Face = Face.NORTH): Texture {
  return getTextureById(cell.textureIds[face]);
}

// Utility function to create a FLOOR Cell.
export function createSimpleFloor(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createCell(CellType.FLOOR, textureIds);
}

// Utility function to create a FLOOR Cell.
export function createFloor(textureIds: number[]): Cell {
  return createCell(CellType.FLOOR, textureIds);
}

// Utility function to create a WALL Cell.
export function createWall(textureIds: number[]): Cell {
  return createCell(CellType.WALL, textureIds, CellProperties.SOLID);
}

// Utility function to create a simple WALL Cell with all faces the same texture.
export function createSimpleWall(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createWall(textureIds);
}

// Utility function to create an Invisible WALL Cell.
export function createInvisibleWall(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createCell(CellType.FLOOR, textureIds, CellProperties.BLOCKED);
}

// Utility function to create a Thin Wall.
export function createThinWall(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createCell(CellType.WALL, textureIds, CellProperties.SOLID | CellProperties.THIN);
}

// Utility function to create a Door.
export function createDoor(textureId: number, speed: number = 1): DoorCell {
  const textureIds = new Array(6).fill(textureId);
  const door = {
    ...createCell(CellType.DOOR, textureIds, CellProperties.SOLID | CellProperties.THIN | CellProperties.INTERACTIVE),
    status: DoorState.CLOSED,
    percent: 100,
    speed
  };
  door.activators.push(activatorDoor);
  door.activators.push(activatorToggle);
  return door;
}

// Utility function to create an ENTRANCE Cell.
export function createEntrance(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createCell(CellType.ENTRANCE, textureIds, CellProperties.SOLID);
}

// Utility function to create an EXIT Cell.
export function createExit(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  return createCell(CellType.EXIT, textureIds);
}

// Utility function to create a Switch Cell.
export function createSimpleSwitchToggle(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  const cell = createCell(CellType.WALL, textureIds, CellProperties.SOLID | CellProperties.INTERACTIVE);
  cell.activators.push(activatorToggle);
  return cell;
}

// Utility function to create a Switch Cell.
export function createSwitchToggle(textureIds: number[]): Cell {
  const cell = createCell(CellType.WALL, textureIds, CellProperties.SOLID | CellProperties.INTERACTIVE);
  cell.activators.push(activatorToggle);
  return cell;
}

// Utility function to create a Switch Cell.
export function createSimpleSwitchCycler(textureId: number): Cell {
  const textureIds = new Array(6).fill(textureId);
  const cell = createCell(CellType.WALL, textureIds, CellProperties.SOLID | CellProperties.INTERACTIVE);
  cell.activators.push(activatorIncrement);
  return cell;
}

// Utility function to determine if a CELL has an Activators
export function hasActivators(cell: Cell): boolean {
  return cell.activators.length > 0;
}

// Utility function to get the Activators for the specified CELL
export function getActivators(cell: Cell): Activator[] {
  return cell.activators;
}

// Utility function to add an Activator to the specified CELL
export function addActivator(cell: Cell, activator: Activator): void {
  cell.activators.push(activator);
}
