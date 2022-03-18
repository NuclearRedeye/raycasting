import { Level } from './interfaces/level';
import { Portal } from './interfaces/portal';
import { Texture } from './interfaces/texture';

import { Player } from './objects/player.js';
import { sleep } from './utils/time-utils.js';
import { getCell, getTextureIdsForLevel } from './utils/level-utils.js';
import { degreesToRadians } from './utils/math-utils.js';
import { CellType } from './enums.js';
import { getTextureById, loadTexture } from './utils/texture-utils.js';
import { isBlocked, isSolid } from './utils/cell-utils.js';

export enum states {
  STARTING,
  LOADING,
  LOADED
}

let currentLevel: Level;
let player: Player;
let currentState: number = states.STARTING;

export function getGameState(): number {
  return currentState;
}

export function setGameState(state: number): void {
  if (state !== currentState) {
    currentState = state;
  }
}

export async function setCurrentLevel(level: Level, start: Portal): Promise<void> {
  setGameState(states.LOADING);

  // FIXME: Should free any resources used by the current level

  // Update the current level
  currentLevel = level;

  // Get the Textures used for the level.
  const textureIds = getTextureIdsForLevel(level);

  // Load the textures.
  const promises: Promise<Texture>[] = [];
  for (const textureId of textureIds) {
    const texture = getTextureById(textureId);
    promises.push(loadTexture(texture));
  }

  // Wait for all the Textures to load.
  await Promise.all(promises);

  // Initialise and position Player
  let playerX = start.x;
  let playerY = start.y;

  // FIXME: If the spawn point is already OK, then no need to do this.
  for (let x = -1; x < 1; x++) {
    for (let y = -1; y < 1; y++) {
      const cell = getCell(level, playerX + x, playerY + y);
      if (cell !== undefined && cell.type === CellType.FLOOR && !isSolid(cell) && !isBlocked(cell)) {
        playerX += x;
        playerY += y;
        break;
      }
    }
  }

  player = new Player(playerX + 0.5, playerY + 0.5);
  player.rotate(degreesToRadians(start.angle));

  // FIXME: Should time the load, and then sleep for the delta.
  await sleep(2000);

  // Update Game State
  setGameState(states.LOADED);
}

export function getPlayer(): Player {
  return player;
}

export function getCurrentLevel(): Level {
  return currentLevel;
}
