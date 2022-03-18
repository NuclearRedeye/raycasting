import { createTextElement } from './utils/utils.js';
import { Mark, getCurrentFramesPerSecond, getDelta, getElapsed } from './utils/time-utils.js';
import { canvasWidth, canvasHeight } from './config.js';
import { levels } from './data/levels/levels.js';
import { render } from './raycaster.js';
import { getCurrentLevel, getGameState, getPlayer, setCurrentLevel, states } from './state.js';
import { checkEntityCollision } from './utils/collision-utils.js';
import { getLevelName } from './utils/level-utils.js';

// Globals
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

// States
let pause: boolean = false;
let debug: boolean = false;

// TODO: Clean this up.
let rotateLeft = false;
let rotateRight = false;
let moveForwards = false;
let moveBackwards = false;

let interact = false;
let interactCooldown = 0;
const interactPerSecond = 2;

let score = 0;
const rotationSpeed = 1.0;
const movementSpeed = 2.0;

function update(elapsed: number): void {
  // FIXME: There are better ways to do this.
  interactCooldown -= Math.floor(elapsed);
  if (interactCooldown < 0) {
    interactCooldown = 0;
  }

  const player = getPlayer();
  if (moveForwards) player.move(movementSpeed / elapsed, getCurrentLevel());
  if (moveBackwards) player.move(-(movementSpeed / 2) / elapsed, getCurrentLevel());
  if (rotateLeft) player.rotate(-rotationSpeed / elapsed);
  if (rotateRight) player.rotate(rotationSpeed / elapsed);
  if (interact && interactCooldown === 0) {
    player.interact(getCurrentLevel());
    interactCooldown = 1000 / interactPerSecond;
  }

  // FIXME: Check Collisions, nothing moves at the moment so for now just player vs all objects...
  const level = getCurrentLevel();
  for (const object of level.objects) {
    if (object.active === false) {
      continue;
    }
    if (checkEntityCollision(player, { ...object, radius: 0.1 })) {
      object.active = false;
      score += 100;
    }
  }
}

// Main Loop
function onTick(timestamp: number): void {
  if (!pause) {
    // Mark the timer
    Mark(timestamp);

    // Clear the Canvas, although no real need as we will be drawing over every pixel.
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    switch (getGameState()) {
      case states.LOADING:
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.font = '24px serif';
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.fillStyle = 'white';
        context.fillText(`${getLevelName(getCurrentLevel())}`, canvasWidth / 2, canvasHeight / 2);
        break;

      case states.LOADED:
        update(getDelta());
        render(context, getPlayer(), getCurrentLevel());
        context.font = '24px serif';
        context.textBaseline = 'top';
        context.fillStyle = 'white';
        context.textAlign = 'end';
        context.fillText(`${score}`, canvasWidth - 10, 10);
        break;
    }

    // If 'debug' is enabled, print various stats.
    if (debug) {
      context.fillStyle = 'white';
      context.font = '12px serif';
      context.textAlign = 'start';
      context.fillText(`Current FPS: ${getCurrentFramesPerSecond().toFixed(2)}`, 10, 10);
      context.fillText(`Previous FT: ${getDelta().toFixed(2)}`, 10, 30);
      context.fillText(`Runtime: ${getElapsed().toFixed(2)} seconds`, 10, 50);
      const player = getPlayer();
      context.fillText(`Player Pos: (${player.x}, ${player.y})`, 10, 70);
      context.fillText(`Player Dir: (${player.dx}, ${player.dy})`, 10, 90);
    }
  }

  window.requestAnimationFrame(onTick);
}

window.onkeydown = (event: KeyboardEvent): void => {
  switch (event.code) {
    case 'KeyW':
      moveForwards = true;
      break;

    case 'KeyA':
      rotateLeft = true;
      break;

    case 'KeyS':
      moveBackwards = true;
      break;

    case 'KeyD':
      rotateRight = true;
      break;

    case 'Space':
      interact = true;
      break;

    default:
      break;
  }
};

window.onkeyup = (event: KeyboardEvent): void => {
  switch (event.code) {
    // Toogle pausing the mainloop
    case 'KeyP':
      pause = !pause;
      break;

    // Toggle debug on or off
    case 'KeyI':
      debug = !debug;
      break;

    case 'KeyW':
      moveForwards = false;
      break;

    case 'KeyA':
      rotateLeft = false;
      break;

    case 'KeyS':
      moveBackwards = false;
      break;

    case 'KeyD':
      rotateRight = false;
      break;

    case 'Space':
      interact = false;
      interactCooldown = 0;
      break;

    default:
      break;
  }
};

window.onload = function (): void {
  canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  context.imageSmoothingEnabled = false;
  document.body.appendChild(canvas);
  document.body.appendChild(createTextElement('Created by NuclearRedeye'));
  window.requestAnimationFrame(onTick);
  setCurrentLevel(levels[0], levels[0].entrance);
};
