import { degreesToRadians } from './utils/utils.js';

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let terminate: boolean = false;
let start: number;
let player: Entity;
let textures: Texture[] = new Array();
let debug = false;

const world: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 2, 2, 2, 2, 0, 0, 1],
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
    let playerCos = Math.cos(degreesToRadians(this.angle)) * amount;
    let playerSin = Math.sin(degreesToRadians(this.angle)) * amount;
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

// Encapsulates a Point
interface Point {
  x: number;                  // The x coordinate of the point.
  y: number;                  // The y coordinate of the point.
};

// Encapsulates a Texture
interface Texture {
  src: string;                // Source image for the texture, e.g. 'image.png'.
  width: number;              // The width, in pixels, of the Texture.
  height: number;             // The height, in pixels, of the Texture.
  image: HTMLImageElement;    // Handle to the DOM image element for this Texture.
  canvas: HTMLCanvasElement;  // Handle to the Offscreen Canvas for this Texture data.
  pixels: string[];
}

// Encapsulates a Cell
interface Cell {
  wall: boolean;
  textureId: number;
}

// Loads the specified image, decodes and copys it to an offscreen canvas and encapsulates it in a Texture object.
async function createTexture(src: string, width: number, height: number) : Promise<Texture> {
  let texture: Texture = {
    src,
    width,
    height,
    image: document.createElement('img') as HTMLImageElement,
    canvas: document.createElement('canvas') as HTMLCanvasElement,
    pixels: []
  };

  // Initialise the offscreen canvas
  texture.canvas.width = width;
  texture.canvas.height = height;

  // Load and wait for the image to be decoded
  texture.image.src = src;
  await texture.image.decode();

  // Blit the image to the offscreen buffer
  const context = texture.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  context.fillStyle = 'white';
  context.fillRect(0,0,width,height);
  context.drawImage(texture.image, 0, 0, width, height, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, texture.width, texture.height).data;
  texture.pixels = createColourBuffer(imageData);
  return texture;
}

function createColourBuffer(imageData: Uint8ClampedArray) {
  let colorArray = [];
  for (let i = 0; i < imageData.length; i += 4) {
      colorArray.push(`rgb(${imageData[i]},${imageData[i + 1]},${imageData[i + 2]})`);
  }
  return colorArray;
}

// Draw a line of the specified colour on the target canvas.
function drawLine(context: CanvasRenderingContext2D, start: Point, end: Point, colour: string) {
  context.strokeStyle = colour;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

// Function that renders a texture using the drawImage function.
function drawTexture(context: CanvasRenderingContext2D, start: Point, end: Point, texturePositionX: number, texture: Texture) {
  context.drawImage(texture.canvas, texturePositionX, 0, 1, texture.height, start.x, start.y, 1, end.y - start.y);
}

// Renders the specified texture as a parallax skybox.
function drawSkybox(context: CanvasRenderingContext2D, start: Point, end: Point, texturePositionX: number, texture: Texture) {
  const wallHeight = end.y - start.y;
  context.drawImage(texture.canvas, texturePositionX, 0, 1, (wallHeight / height) * texture.height, start.x, start.y, 1, wallHeight);
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
  // First we calculate the angle of the first, leftmost of the player, ray to cast.
  let rayAngle = player.angle - halfFieldOfView;

  // We then iterate over and render each vertical scan line of the view port, incrementing the angle by ( FOV / width )
  for (let column = 0; column < columns; column++) {
    
    // The ray starts from the players current grid position.
    let ray: Point = {x: player.x, y: player.y};

    // These are the X and Y amounts that we need to add to check for hits against walls.
    let rayCos = Math.cos(degreesToRadians(rayAngle)) / precision;
    let raySin = Math.sin(degreesToRadians(rayAngle)) / precision;

    // We start from the assumption that we're not already in a wall!
    let wall = 0;

    // Then, whilst we haven't hit a wall 
    while(wall == 0) {
        ray.x += rayCos;
        ray.y += raySin;
        wall = world[Math.floor(ray.y)][Math.floor(ray.x)];
    }

    // We should now have the coordinates of the wall, hence we can work out the distance the wall is from the player by
    // using Pythagoras's theorem.
    let distance = Math.sqrt(Math.pow(player.x - ray.x, 2) + Math.pow(player.y - ray.y, 2));

    // Fish eye fix
    distance = distance * Math.cos(degreesToRadians(rayAngle - player.angle));

    // Now work out how high the wall should be...
    let wallHeight = Math.floor(halfHeight / distance);

    // Get texture
    let texture = textures[wall - 1];

    // Calculate texture position (This is drawing the image mirrored...)
    let texturePositionX = Math.floor((texture.width * (ray.x + ray.y)) % texture.width);

    // And now we can draw the scanline...
    const start: Point = {x: column, y: 0};
    const wallStart: Point = {x: column, y: halfHeight - wallHeight};
    const wallEnd: Point = {x: column, y: halfHeight + wallHeight};
    const end: Point = {x:column, y: height};

    // 1. Draw the Skybox..
    drawSkybox(context, start, wallStart, Math.abs(rayAngle % 360), textures[textures.length - 1]);

    // 2. Draw the Textured Wall...
    drawTexture(context, wallStart, wallEnd, texturePositionX, textures[wall]);

    // 3. Apply some shading based on distance from player... 
    drawLine(context, wallStart, wallEnd, `rgba(0,0,0,${0.08 * distance})`);

    // 4. Draw the floor
    drawLine(context, wallEnd, end, 'gray');

    // Increment the angle ready to cast the next ray.
    rayAngle += increment;
  }
}

// Main Loop
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

  if (debug) {
    context.fillStyle = "white";
    context.fillText(`Current FPS: ${(1000 / elapsed).toFixed(2)}`, 10, 10);
    context.fillText(`Current FT:  ${elapsed.toFixed(2)}`, 10, 30);
    context.fillText(`Processing Time:  ${(endTime - startTime).toFixed(2)}`, 10, 50);
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

async function load() {
  return Promise.all([
    textures.push(await createTexture('assets/wall.brick.00.png', 16, 16)),
    textures.push(await createTexture('assets/wall.brick.01.png', 16, 16)),
    textures.push(await createTexture('assets/wall.brick.02.png', 16, 16)),
    textures.push(await createTexture('assets/background.01.png', 360, 60))
  ]);
}

window.onload = function(): void {
  load().then(() => {
    player = new Entity(8.5, 3.5, 135);
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d",{ alpha: false }) as CanvasRenderingContext2D;
    context.imageSmoothingEnabled = false;
    context.globalAlpha = 1.0;
    window.requestAnimationFrame(onTick);
  });
};
