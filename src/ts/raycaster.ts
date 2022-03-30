import { Entity } from './interfaces/entity';
import { Sprite } from './interfaces/sprite';
import { Level } from './interfaces/level';
import { Rectangle } from './interfaces/rectangle';
import { CastResult } from './interfaces/raycaster';
import { Point } from './interfaces/point';
import { Cell, DoorCell } from './interfaces/cell';

import { Face } from './enums.js';
import { drawGradient, drawTexture, drawTint } from './utils/canvas-utils.js';
import { getTexture, isDoor, isSolid, isThin } from './utils/cell-utils.js';
import { getCell } from './utils/level-utils.js';
import { getAnimationFrame } from './utils/time-utils.js';
import { applyEffectTint, getTextureById, isTextureAnimated, isTextureStateful } from './utils/texture-utils.js';
import { isSpriteAlignedBottom, isSpriteAlignedTop, isSpriteStatic, isSpriteTinted } from './utils/sprite-utils.js';
import { radiansToDegrees } from './utils/math-utils.js';

// Derived from https://lodev.org/cgtutor/raycasting.html.
// Casts a ray from the specified point at the specified angle and returns the first Wall the ray impacts.
export function castRay(width: number, column: number, entity: Entity, level: Level, maxDepth: number = 50): CastResult | undefined {
  const camera = (2 * column) / width - 1;
  const rayDirectionX = entity.dx + entity.cx * camera;
  const rayDirectionY = entity.dy + entity.cy * camera;

  // Calculate the distance from one cell boundary to the next boundary in the X or Y direction.
  const deltaDistanceX = Math.abs(1 / rayDirectionX);
  const deltaDistanceY = Math.abs(1 / rayDirectionY);

  // Tracks the current Cell as the line is cast.
  const castCell: Point = { x: Math.floor(entity.x), y: Math.floor(entity.y) };

  // Tracks the total distance from the ray's origin as the line is cast.
  const castDistance: Point = { x: 0, y: 0 };

  // Counts the steps along each axis as the line is cast.
  const castStep: Point = { x: 0, y: 0 };

  // Step to the next Cell on the X Axis.
  if (rayDirectionX < 0) {
    castStep.x = -1;
    castDistance.x = (entity.x - castCell.x) * deltaDistanceX;
  } else {
    castStep.x = 1;
    castDistance.x = (castCell.x + 1 - entity.x) * deltaDistanceX;
  }

  // Step to the next Cell on the Y Axis.
  if (rayDirectionY < 0) {
    castStep.y = -1;
    castDistance.y = (entity.y - castCell.y) * deltaDistanceY;
  } else {
    castStep.y = 1;
    castDistance.y = (castCell.y + 1 - entity.y) * deltaDistanceY;
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
    if (isSolid(cell)) {
      // Calculate the distance from the ray's origin to the solid that was hit, and the specific point on the wall the ray hit.
      let distance = 0;
      let wall = 0;
      switch (side) {
        case Face.EAST:
        case Face.WEST:
          if (isThin(cell)) {
            // Check if the ray hits the center line of the thin wall, if not then it will hit the adjacent cell hence continue.
            if (castDistance.x - deltaDistanceX * 0.5 > castDistance.y) {
              continue;
            }

            // FIXME: When updating this function to return a drawing list, this will need to be reversed before the loop continues.
            castCell.x += castStep.x * 0.5;
          }

          distance = Math.abs((castCell.x - entity.x + (1 - castStep.x) / 2) / rayDirectionX);
          wall = entity.y + ((castCell.x - entity.x + (1 - castStep.x) / 2) / rayDirectionX) * rayDirectionY;
          wall -= Math.floor(wall);

          // If the cell is a door, the account for the door opening or closing.
          if (isDoor(cell)) {
            // Calculate the percentage that the door is open.
            const doorOpenPercent = 0.01 * (cell as DoorCell).percent;

            // Check if the ray hits the door, and if not continue to cast.
            if (wall > doorOpenPercent) {
              castCell.x -= castStep.x * 0.5;
              continue;
            }

            // Offset the texture for the door based on how open it is.
            wall = doorOpenPercent - wall;
          }
          break;

        case Face.NORTH:
        case Face.SOUTH:
          if (isThin(cell)) {
            // Check if the ray hits the center line of the thin wall, if not then it will hit the adjacent cell hence continue.
            if (castDistance.y - deltaDistanceY * 0.5 > castDistance.x) {
              continue;
            }

            // FIXME: When updating this function to return a drawing list, this will need to be reversed before the loop continues.
            castCell.y += castStep.y * 0.5;
          }
          distance = Math.abs((castCell.y - entity.y + (1 - castStep.y) / 2) / rayDirectionY);
          wall = entity.x + ((castCell.y - entity.y + (1 - castStep.y) / 2) / rayDirectionY) * rayDirectionX;
          wall -= Math.floor(wall);

          if (isDoor(cell)) {
            // Calculate the percentage that the door is open.
            const doorOpenPercent = 0.01 * (cell as DoorCell).percent;

            // Check if the ray hits the door, and if not continue to cast.
            if (wall > doorOpenPercent) {
              castCell.y -= castStep.y * 0.5;
              continue;
            }

            // Offset the texture for the door based on how open it is.
            wall = doorOpenPercent - wall;
          }
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

// Draws the floor for the specified level, from the perspective of the specified Entity, onto the specified Canvas.
export function renderFloorAndCeiling(context: CanvasRenderingContext2D, entity: Entity, level: Level): void {
  // The width and height of the context.
  const width = context.canvas.width;
  const height = context.canvas.height;
  const halfHeight = height / 2;

  // Create a temporary buffer for storing the data. This can then be copied to the framebuffer in a single draw operation.
  // FIXME: Avoid reallocating this buffer each frame, should cache it unless the width changes.
  const buffer: ImageData = context.createImageData(width, height);

  // Calculate the X and Y positions for the leftmost ray, where x = 0, and the rightmost ray, where x = width.
  const rayDirX0 = entity.dx - entity.cx;
  const rayDirY0 = entity.dy - entity.cy;
  const rayDirX1 = entity.dx + entity.cx;
  const rayDirY1 = entity.dy + entity.cy;

  // For each row from the horizon to the bottom of the screen.
  for (let y = 0; y < halfHeight; y++) {
    // Calculate the distance from the camera to the floor for the current row.
    const rowDistance = y > 0 ? halfHeight / y : halfHeight;

    // Calculate the real world step vector we have to add for each x (parallel to camera plane)
    // adding step by step avoids multiplications with a weight in the inner loop
    const stepX = (rowDistance * (rayDirX1 - rayDirX0)) / width;
    const stepY = (rowDistance * (rayDirY1 - rayDirY0)) / width;

    // Calculate the X and Y positions for the first pixel in the row.
    let rowX = entity.x + rowDistance * rayDirX0;
    let rowY = entity.y + rowDistance * rayDirY0;

    // For each pixel in the row.
    for (let x = 0; x < width; x++) {
      // Calculate the X and Y coordinates of the specific cell.
      const cellX = Math.floor(rowX);
      const cellY = Math.floor(rowY);

      // Get the cell
      const cell = getCell(level, cellX, cellY);

      // Get the specific textures for the target cell.
      let floorTexture, ceilingTexture;
      if (cell !== undefined) {
        floorTexture = getTexture(cell, Face.BOTTOM);
        ceilingTexture = getTexture(cell, Face.TOP);
      } else {
        if (level.floor) {
          floorTexture = getTextureById(level.floor);
        }

        if (level.ceiling) {
          ceilingTexture = getTextureById(level.ceiling);
        }
      }

      if (floorTexture) {
        // Calculate the specific X and Y pixel of the texture coordinate for this pixel.
        const tx = Math.floor(floorTexture.width * (rowX - cellX)) & (floorTexture.width - 1);
        const ty = Math.floor(floorTexture.height * (rowY - cellY)) & (floorTexture.height - 1);

        // If the texture is animated, then calculate the offset for the frame within the texture.
        let texXAnimationOffset = 0;
        if (isTextureAnimated(floorTexture)) {
          const frame = getAnimationFrame();
          texXAnimationOffset = frame * floorTexture.width;
        }

        // If the texture is stateful, then calculate the Y offset for the frame within the texture.
        let texYStateOffset = 0;
        if (isTextureStateful(floorTexture)) {
          texYStateOffset = ((cell as Cell).state % floorTexture.states) * (floorTexture.height * floorTexture.imageWidth);
        }

        // Get the RGBA values for the specified pixel directly from the textures data buffer.
        const sourceOffset = 4 * (texYStateOffset + (texXAnimationOffset + tx + ty * floorTexture.imageWidth));
        const textureBuffer = floorTexture.buffer as Uint8ClampedArray;
        const pixel = {
          r: textureBuffer[sourceOffset],
          g: textureBuffer[sourceOffset + 1],
          b: textureBuffer[sourceOffset + 2],
          a: textureBuffer[sourceOffset + 3]
        };

        // Write that RGBA data into the correct location in the temporary buffer.
        const offset = 4 * (Math.floor(x) + Math.floor(halfHeight + y) * width);
        buffer.data[offset] = pixel.r;
        buffer.data[offset + 1] = pixel.g;
        buffer.data[offset + 2] = pixel.b;
        buffer.data[offset + 3] = pixel.a;
      }

      if (ceilingTexture) {
        // Calculate the specific X and Y pixel of the texture coordinate for this pixel.
        let tx = Math.floor(ceilingTexture.width * (rowX - cellX)) & (ceilingTexture.width - 1);
        const ty = Math.floor(ceilingTexture.height * (rowY - cellY)) & (ceilingTexture.height - 1);

        // Flip the Ceiling on the X axis
        // TODO: Add support for flipping textures on surfaces based on flags.
        tx = ceilingTexture.width - 1 - tx;

        // If the texture is animated, then calculate the offset for the frame within the texture.
        let texXAnimationOffset = 0;
        if (isTextureAnimated(ceilingTexture)) {
          const frame = getAnimationFrame();
          texXAnimationOffset = frame * ceilingTexture.width;
        }

        // If the texture is stateful, then calculate the Y offset for the frame within the texture.
        let texYStateOffset = 0;
        if (isTextureStateful(ceilingTexture)) {
          texYStateOffset = ((cell as Cell).state % ceilingTexture.states) * (ceilingTexture.height * ceilingTexture.imageWidth);
        }

        // Get the RGBA values for the specified pixel directly from the textures data buffer.
        const sourceOffset = 4 * (texYStateOffset + (texXAnimationOffset + tx + ty * ceilingTexture.imageWidth));
        const textureBuffer = ceilingTexture.buffer as Uint8ClampedArray;
        const pixel = {
          r: textureBuffer[sourceOffset],
          g: textureBuffer[sourceOffset + 1],
          b: textureBuffer[sourceOffset + 2],
          a: textureBuffer[sourceOffset + 3]
        };

        // Write that RGBA data into the correct location in the temporary buffer.
        const offset = 4 * (Math.floor(x) + Math.floor(halfHeight - 1 - y) * width);
        buffer.data[offset] = pixel.r;
        buffer.data[offset + 1] = pixel.g;
        buffer.data[offset + 2] = pixel.b;
        buffer.data[offset + 3] = pixel.a;
      }

      // Increment the X and Y coordinates ready for the next pixel.
      rowX += stepX;
      rowY += stepY;
    }
  }

  // Copy the data from the temporary buffer to the framebuffer.
  context.putImageData(buffer, 0, 0);

  // TODO: It might be more performant to apply the tint when writing the RGB values to the temporary buffer.
  drawGradient(context, { x: 0, y: halfHeight - 1 }, { x: width, y: height }, 'rgba(0,0,0,180)', 'transparent');
  drawGradient(context, { x: 0, y: 0 }, { x: width, y: halfHeight }, 'transparent', 'rgba(0,0,0,180)');
}

// Function to render the specified sprite, from the perspective of the specified entity, to the specified canvas.
export function renderSprite(context: CanvasRenderingContext2D, entity: Entity, depthBuffer: number[], sprite: Sprite): void {
  // The width and height of the context.
  const width = context.canvas.width;
  const height = context.canvas.height;
  const halfHeight = height / 2;

  // Get the texture for the sprite
  const texture = getTextureById(sprite.textureId);

  // Calculate the sprites position
  const spriteX = sprite.x - entity.x;
  const spriteY = sprite.y - entity.y;

  // Calculate some magic which I don't really understand myself, but it works.
  const invDet = 1.0 / (entity.cx * entity.dy - entity.dx * entity.cy);
  const transformX = invDet * (entity.dy * spriteX - entity.dx * spriteY);
  const transformY = invDet * (-entity.cy * spriteX + entity.cx * spriteY);

  // FIXME: This prevents rendering sprites behind the player, but only works based on a 180 degree perspective. Should tune this to work based on field of view.
  if (transformY <= 0) {
    return;
  }

  // The X position of the sprite
  const spriteScreenX = Math.round((width / 2) * (1 + transformX / transformY));

  // Calculate the height of the sprite.
  const spriteHeight = Math.abs(Math.floor(height / transformY));

  // Calculate the width of the sprite.
  const spriteWidth = Math.abs(Math.floor(height / transformY));

  const destinationRectangle: Rectangle = {
    x: Math.floor(-spriteWidth / 2 + spriteScreenX),
    y: -spriteHeight / 2 + halfHeight,
    width: spriteWidth,
    height: spriteHeight
  };

  /*
  // Calculate where to start drawing the sprite on the Y Axis.
  let drawStartY = -spriteHeight / 2 + halfHeight;
  if (drawStartY < 0) {
    drawStartY = 0;
  }

  // Calculate where to stop drawing the sprite on the Y Axis.
  let drawEndY = spriteHeight / 2 + halfHeight;
  if (drawEndY >= height) {
    drawEndY = height - 1;
  }

  // Calculate where to start drawing the sprite on the X Axis. Aka the column of the screen to start at.
  let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
  if (drawStartX < -spriteWidth) {
    drawStartX = -spriteWidth;
  }

  // Calculate where to stop drawing the sprite on the X Axis. Aka the column of the screen to end at.
  let drawEndX = drawStartX + spriteWidth;
  if (drawEndX > width + spriteWidth) {
    drawEndX = width + spriteWidth;
  }
  */
  // Calculate the Y offset within the texture to start drawing from.
  //const texStartYD = drawStartY * 256 - height * 128 + spriteHeight * 128;
  //const texStartY = Math.round((texStartYD * texture.height) / spriteHeight / 256);

  // Calculate the Y offset within the texture to stop drawing from.
  //const texEndYD = (drawEndY - 1) * 256 - height * 128 + spriteHeight * 128;
  //const texEndY = Math.round((texEndYD * texture.height) / spriteHeight / 256);

  // Calculate the vertical offset which enables vertical alignment of the sprite to the floor or ceiling.
  /*
  if (isSpriteAlignedTop(sprite)) {
    drawEndY = drawStartY + spriteHeight;
  } else if (isSpriteAlignedBottom(sprite)) {
    drawStartY = drawEndY - spriteHeight;
  }
  */

  // If the object is animated, then calculate the offset for the frame within the texture.
  let texXAnimationOffset = 0;
  if (isTextureAnimated(texture)) {
    const frame = getAnimationFrame();
    texXAnimationOffset = frame * texture.width;
  }

  // If the sprite is static, then calculate which frame to render relative to the entity's position
  if (isSpriteStatic(sprite)) {
    const radians = Math.atan2(sprite.y - entity.y, sprite.x - entity.x);

    // FIXME: Do I even need to convert this back to degrees?
    let degrees = radiansToDegrees(radians);

    // FIXME: This slightly offsets the sprite by 1/2 a frame in degrees, but could probably handle this by applying a rotation to the sprite.
    degrees += 360 / texture.frames / 2;
    if (degrees < 0) {
      degrees += 360;
    }
    if (degrees >= 360) {
      degrees -= 360;
    }

    // Calculate the specific frame to display
    const frame = Math.floor((texture.frames / 360) * degrees);
    texXAnimationOffset = frame * texture.width;
  }

  // Apply a darkened tint to the sprite, based on its distance from the entity.
  if (isSpriteTinted(sprite)) {
    applyEffectTint(texture, texXAnimationOffset, ((height / (sprite.distance || 0)) * 1.6) / height);
  }

  // The slice of the texture that we want to render to the framebuffer.
  const sourceRectangle: Rectangle = {
    x: 0,
    y: 0,
    width: texture.width,
    height: texture.height
  };

  let canvas = texture.canvas;

  // Apply a darkened tint to the sprite, based on its distance from the entity.
  if (isSpriteTinted(sprite)) {
    canvas = texture.effect as HTMLCanvasElement;
    //sourceRectangle.x = texX;
  }

  // Draw the sprite to the screen.
  drawTexture(context, canvas as HTMLCanvasElement, sourceRectangle, destinationRectangle);

  /*
  // Then, for each column draw a vertical strip of the sprite.
  for (let column = drawStartX; column < drawEndX; column++) {
    // Only draw the sprite if..
    // - It's in front of camera.
    // - It's not off the left edge of the viewport.
    // - It's not off the right edge of the viewport.
    // - It's not too far away or hidden behind another solid that has already been rendered.
    if (transformY > 0 && column >= 0 && column < width && transformY < depthBuffer[column]) {
      // Calculate the X offset within the texture to start drawing from.
      let texX = Math.floor((256 * (column - (-spriteWidth / 2 + spriteScreenX)) * texture.width) / spriteWidth / 256);

      // FIXME: This works around a rounding error that can occur above.
      if (texX < 0) {
        texX = 0;
      }

      // The slice of the texture that we want to render to the framebuffer.
      const sourceRectangle: Rectangle = {
        x: texX + texXAnimationOffset,
        y: 0,
        width: 1,
        height: texture.height
      };

      // The location to render that texture to in the framebuffer.
      const destinationRectangle: Rectangle = {
        x: column,
        y: drawStartY,
        width: 1,
        height: spriteHeight
      };

      let canvas = texture.canvas;

      // Apply a darkened tint to the sprite, based on its distance from the entity.
      if (isSpriteTinted(sprite)) {
        canvas = texture.effect as HTMLCanvasElement;
        sourceRectangle.x = texX;
      }

      // Draw the sprite to the screen.
      drawTexture(context, canvas as HTMLCanvasElement, sourceRectangle, destinationRectangle);
    }
  }
  */
}

// Function to render the specified level, from the perspective of the specified entity to the target canvas
export function render(context: CanvasRenderingContext2D, entity: Entity, level: Level): void {
  // The width and height of the context.
  const width = context.canvas.width;
  const height = context.canvas.height;

  // FIXME: Shouldn't need to reallocate this every frame.
  const depthBuffer = new Array(width).fill(50);

  // Draw the Floor and Ceiling
  renderFloorAndCeiling(context, entity, level);

  // Draw the Walls
  for (let column = 0; column < width; column++) {
    // Get the first solid cell this ray hits.
    const result = castRay(width, column, entity, level);

    // FIXME: Should draw something when no solid is found within the maximum range.
    if (result !== undefined) {
      // Stick the distance into the Depth Buffer
      depthBuffer[column] = result.distance;

      // Calculate the height the wall should be rendered at based on its distance from the entity.
      let wallHeight = Math.abs(Math.floor(height / result.distance));

      // FIXME: Quick kludge to workaround the issue where from a certain distance the floor/ceiling is visible above/below a wall.
      wallHeight += 2;

      // Calculate the position on the Y axis of the viewport to start drawing the wall from.
      const wallY = -wallHeight / 2 + height / 2;

      // Get the texture for the solid cell.
      const texture = getTexture(result.cell, result.face);

      // Calculate the X offset in the Texture for the slice that needs to be rendered.
      let wallX = Math.floor(result.wall * texture.width);

      // If the texture is animated, then calculate the X offset for the frame within the texture.
      let textureAnimationOffset = 0;
      if (isTextureAnimated(texture)) {
        const frame = getAnimationFrame();
        textureAnimationOffset = frame * texture.width;
      }

      // If the texture is stateful, then calculate the Y offset for the frame within the texture.
      let textureStateOffset = 0;
      if (isTextureStateful(texture)) {
        textureStateOffset = (result.cell.state % texture.states) * texture.height;
      }

      // If the face of the wall is North or East then need to invert the X offset.
      if (result.face === Face.NORTH || result.face === Face.EAST) {
        wallX = texture.width - wallX - 1;
      }

      // The slice of the texture that we want to render to the framebuffer.
      const sourceRectangle: Rectangle = {
        x: textureAnimationOffset + wallX,
        y: textureStateOffset,
        width: 1,
        height: texture.height
      };

      // The location to render that texture to in the framebuffer.
      const destinationRectangle: Rectangle = {
        x: column,
        y: wallY,
        width: 1,
        height: wallHeight
      };

      // Draw the wall to the framebuffer.
      drawTexture(context, texture.canvas as HTMLCanvasElement, sourceRectangle, destinationRectangle);

      // Apply a darkened tint to the wall, based on its distance from the entity.
      drawTint(context, destinationRectangle, (wallHeight * 1.6) / height);
    }
  }

  // FIXME: On level load, create a linked list for active sprites and use that rather than allocate this each frame.
  // Prepare the sprites...
  const sprites: Sprite[] = [...level.sprites];
  for (const sprite of sprites) {
    sprite.distance = Math.sqrt((entity.x - sprite.x) * (entity.x - sprite.x) + (entity.y - sprite.y) * (entity.y - sprite.y));
  }

  // Sort sprites from far to close
  sprites.sort((a, b) => {
    // FIXME: Possibly undefined
    return (b.distance || 0) - (a.distance || 0);
  });

  // After sorting the sprites, do the projection and draw them
  for (let i = 0; i < sprites.length; i++) {
    // For ease...
    const sprite = sprites[i];

    // Don't bother on non-active sprites.
    if (sprite.active === false) {
      continue;
    }

    renderSprite(context, entity, depthBuffer, sprite);
  }
}
