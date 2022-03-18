import { Circle } from '../interfaces/circle';
import { Rectangle } from '../interfaces/rectangle';

export function checkEntityCollision(a: Circle, b: Circle): boolean {
  let retVal = false;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < a.radius + b.radius) {
    retVal = true;
  }
  return retVal;
}

export function checkEntityWithCell(entity: Circle, rectangle: Rectangle): boolean {
  // temporay variables to set edges for testing
  let testX = entity.x;
  let testY = entity.y;

  // Calculate which side is closest on the X axis.
  if (entity.x < rectangle.x) {
    testX = rectangle.x;
  } else if (entity.x > rectangle.x + rectangle.width) {
    testX = rectangle.x + rectangle.width;
  }

  // Calculate which side is closest on the Y axis.
  if (entity.y < rectangle.y) {
    testY = rectangle.y;
  } else if (entity.y > rectangle.y + rectangle.height) {
    testY = rectangle.y + rectangle.height;
  }

  // get distance from closest edges
  const distX = entity.x - testX;
  const distY = entity.y - testY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  // if the distance is less than the entity.radius, collision!
  if (distance <= entity.radius) {
    return true;
  }
  return false;
}
