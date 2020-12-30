import { createTextElement } from './utils/utils.js';

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let terminate: boolean = false;
let start: number;
let player: Entity;
let image: HTMLImageElement;

const textures = [
  {
      width: 8,
      height: 8,
      bitmap: [
          [1,1,1,1,1,1,1,1],
          [0,0,0,1,0,0,0,1],
          [1,1,1,1,1,1,1,1],
          [0,1,0,0,0,1,0,0],
          [1,1,1,1,1,1,1,1],
          [0,0,0,1,0,0,0,1],
          [1,1,1,1,1,1,1,1],
          [0,1,0,0,0,1,0,0]
      ],
      colors: [
          "rgb(255, 241, 232)",
          "rgb(194, 195, 199)",
      ]
  }
];

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
    this.angle %= 360;
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

// This function draws a strip of the specified texture 
function drawTexture(x: number, wallHeight: number, texturePositionX: number, texture: any) {
  let yIncrementer = (wallHeight * 2) / texture.height;

  // The vertical point to start drawing from.
  let y = halfHeight - wallHeight;

  for(let i = 0; i < texture.height; i++) {
      context.strokeStyle = texture.colors[texture.bitmap[i][texturePositionX]];
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y + (yIncrementer + 0.5));
      context.stroke();
      y += yIncrementer;
  }
}

// This function draws a strip of the specified texture 
function drawTextureAlt(x: number, wallHeight: number, texturePositionX: number, texture: HTMLImageElement) {
  //let yIncrementer = (wallHeight * 2) / texture.height;

  // The vertical point to start drawing from.
  let y = halfHeight - wallHeight;

  // Draw the texture.
  context.drawImage(texture, texturePositionX, 0, 1, 16, x, y, 1, wallHeight * 2);
}

let rotateLeft = false;
let rotateRight = false;
let moveForwards = false;
let moveBackwards = false;

function update(elapsed: number): void {
  if (moveForwards) player.move(3.0 / elapsed);
  if (moveBackwards) player.move(-1.0 / elapsed);
  if (rotateLeft) player.rotate(-70 / elapsed);
  if (rotateRight) player.rotate(70 / elapsed);
}

function render(): void {
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

    // Get texture
    let texture = textures[wall - 1];

    // Calcule texture position
    let texturePositionX = Math.floor((16 * (rayX + rayY)) % 16);

    // And finally, draw...
    drawLine(i, 0, i, halfHeight - wallHeight, "black");
    //drawLine(i, halfHeight - wallHeight, i, halfHeight + wallHeight, "red");
    drawTextureAlt(i, wallHeight, texturePositionX, image);
    drawLine(i, halfHeight - wallHeight, i, halfHeight + wallHeight, `rgba(0,0,0,${0.15 * distance})`);
    drawLine(i, halfHeight + wallHeight, i, height, "gray");

    // Increment the angle ready to cast the next ray.
    rayAngle += increment;
  }
}


function onTick(timestamp: number) {
  let startTime = performance.now();

  if (start === undefined) {
    start = timestamp;
  }
  const elapsed = timestamp - start;
  start = timestamp;

  // Clear the Canvas, although no real need.
  context.clearRect(0, 0, canvas.width, canvas.height);

  update(elapsed);
  render();


  let endTime = performance.now();

  context.fillStyle = "white";
  context.fillText(`Current FPS: ${(1000 / elapsed).toFixed(2)}`, 10, 10);
  context.fillText(`Current FT:  ${elapsed.toFixed(2)}`, 10, 30);
  context.fillText(`Processing Time:  ${(endTime - startTime).toFixed(2)}`, 10, 50);

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
      moveForwards = true;
      break;

    case "KeyA":
      rotateLeft = true;
      break;

    case "KeyS":
      moveBackwards = true;
      break;

    case "KeyD":
      rotateRight = true;
      break;

    default:
      break;
  }
}

window.onkeyup  = (event: KeyboardEvent) => {
  switch(event.code) {
    case "KeyP":
      terminate = true;
      break;

    case "KeyW":
      moveForwards = false;
      break;

    case "KeyA":
      rotateLeft = false;
      break;

    case "KeyS":
      moveBackwards = false;
      break;

    case "KeyD":
      rotateRight = false;
      break;

    default:
      break;
  }
}

window.onload = function(): void {
  player = new Entity(5, 5, 0);
  image = document.getElementById("tex") as HTMLImageElement;
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  context = canvas.getContext("2d") as CanvasRenderingContext2D;
  window.requestAnimationFrame(onTick);
};
