import { createTextElement } from './utils/utils.js';

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let terminate: boolean = false;
let start: number;
let player: Player;

const world = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

class Entity {
  x: number;      // The X position of the Entity
  y: number;      // The Y position of the Entity
  angle: number;  // The direction, in degrees, that the Entity is looking.

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }

  rotate(amount: number) {
    this.angle += amount;
  }

  move(amount: number) {
    let playerCos = Math.cos(degreeToRadians(this.angle)) * amount;
    let playerSin = Math.sin(degreeToRadians(this.angle)) * amount;
    let newX = this.x + playerCos;
    let newY = this.y + playerSin;

    // Collision test
    if(world[Math.floor(newY)][Math.floor(newX)] == 0) {
        this.x = newX;
        this.y = newY;
    }
  }
}

const width = 640;                        // The width, in pixels, of the screen.
const height = 480;                       // The height, in pixels, of the screen.
const halfWidth = width / 2;              // Half the width of the screen, in pixels.
const halfHeight = height / 2;            // Half the height of the screen, in pixels.
const columns = width;                    // The number of columns in the viewport, or basically the number or Rays to cast.
const fieldOfView = 60;                   // The field of view, in degrees, of the camera.
const halfFieldOfView = fieldOfView / 2;  // Half the field of view.

const precision = 64;                     // The dimensions of each square in the grid.
const increment = fieldOfView / columns;  // The step to add for each ray cast.

// Converts a value from degress to radians.
function degreeToRadians(value: number) : number {
  return value * Math.PI / 180;
}


// Util function to draw a line.
function drawLine(x1: number, y1: number, x2: number, y2: number, colour: string) {
  context.strokeStyle = colour;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function onTick(timestamp: number) {
  if (start === undefined) {
    start = timestamp;
  }
  const elapsed = timestamp - start;

  // Clear the Canvas, although no real need.
  context.clearRect(0, 0, canvas.width, canvas.height);

  let rayAngle = player.angle - halfFieldOfView;
  for (let i = 0; i < columns; i++) {
    
    // The ray starts from the players current grid position.
    let rayX = player.x;
    let rayY = player.y;

    // These are the X and Y amounts that we need to add to check for hits against walls.
    let rayCos = Math.cos(degreeToRadians(rayAngle)) / precision;
    let raySin = Math.sin(degreeToRadians(rayAngle)) / precision;

    // We start from the assumption that we're not already in a wall!
    let wall = 0;

    // Then, whilst we haven't hit a wall 
    while(wall == 0) {
        rayX += rayCos;
        rayY += raySin;
        wall = world[Math.floor(rayY)][Math.floor(rayX)];
    }

    // We should now have the coordinates of the wall, hence now to work out the distance.
    let distance = Math.sqrt(Math.pow(player.x - rayX, 2) + Math.pow(player.y - rayY, 2));

    // Fish eye fix
    distance = distance * Math.cos(degreeToRadians(rayAngle - player.angle));

    // Now work out how high the wall should be...
    let wallHeight = Math.floor(halfHeight / distance);

    // And finally, draw...
    drawLine(i, 0, i, halfHeight - wallHeight, "cyan");
    drawLine(i, halfHeight - wallHeight, i, halfHeight + wallHeight, "red");
    drawLine(i, halfHeight + wallHeight, i, height, "green");

    // Increment the angle ready to cast the next ray.
    rayAngle += increment;
  }

  if (!terminate)
  {
    window.requestAnimationFrame(onTick);
  }
}

window.onkeydown = (event: KeyboardEvent) => {
  switch(event.code) {
    case "KeyP":
      terminate = true;
      break;

    case "KeyW":
      player.move(1);
      break;

    case "KeyA":
      player.rotate(-5);
      break;

    case "KeyS":
      player.move(-1);
      break;

    case "KeyD":
      player.rotate(5);
      break;

    default:
      break;
  }
}

window.onload = function(): void {
  player = new Entity(5, 5, 0);
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  context = canvas.getContext("2d") as CanvasRenderingContext2D;
  window.requestAnimationFrame(onTick);
};
