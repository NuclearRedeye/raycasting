import { Texture } from '../../interfaces/texture';

import { createTextureAnimated, createTextureBasic, createTextureStateful } from '../../utils/texture-utils.js';

// Stores all the Textures that are used in the game.
export const textures: Texture[] = [
  createTextureBasic(1, 'assets/debug.wall.01.png', 16, 16),
  createTextureBasic(2, 'assets/debug.floor.01.png', 16, 16),
  createTextureBasic(3, 'assets/debug.ceiling.01.png', 16, 16),
  createTextureStateful(4, 'assets/debug.switch.toggle.png', 16, 16, 2),
  createTextureAnimated(5, 'assets/debug.animated.01.png', 16, 16, 8),
  createTextureBasic(6, 'assets/debug.wall.north.png', 16, 16),
  createTextureBasic(7, 'assets/debug.wall.east.png', 16, 16),
  createTextureBasic(8, 'assets/debug.wall.south.png', 16, 16),
  createTextureBasic(9, 'assets/debug.wall.west.png', 16, 16),
  createTextureStateful(10, 'assets/debug.switch.cycle.png', 16, 16, 8),
  createTextureAnimated(11, 'assets/object.coin.01.png', 16, 16, 8)
];
