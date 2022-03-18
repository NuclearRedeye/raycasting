import { Sprite } from '../interfaces/sprite';

import { SpriteProperties } from '../enums.js';

function createSprite(x: number, y: number, textureId: number, scale: number, properties: number): Sprite {
  return {
    x,
    y,
    active: true,
    textureId,
    scale,
    properties
  };
}

// Checks if the specified sprite has the specified property
function spriteHasProperty(sprite: Sprite, property: SpriteProperties): number {
  return sprite.properties & property;
}

// Checks if the specified sprite is tinted.
export function isSpriteTinted(sprite: Sprite): number {
  return spriteHasProperty(sprite, SpriteProperties.TINT);
}

// Checks if the specified sprite should vertically align to the ceiling.
export function isSpriteAlignedTop(sprite: Sprite): number {
  return spriteHasProperty(sprite, SpriteProperties.ALIGN_TOP);
}

// Checks if the specified sprite should vertically align to the floor.
export function isSpriteAlignedBottom(sprite: Sprite): number {
  return spriteHasProperty(sprite, SpriteProperties.ALIGN_BOTTOM);
}

// Checks if the specified sprite is static.
export function isSpriteStatic(sprite: Sprite): number {
  return spriteHasProperty(sprite, SpriteProperties.STATIC);
}

export function createSpriteBasic(x: number, y: number, textureId: number, scale: number, properties: number = 0): Sprite {
  return createSprite(x, y, textureId, scale, properties | SpriteProperties.TINT);
}

export function createSpriteNoTint(x: number, y: number, textureId: number, scale: number, properties: number = 0): Sprite {
  return createSprite(x, y, textureId, scale, properties);
}
