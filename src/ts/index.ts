import { Timer } from './interfaces/timer';
import { Point } from './interfaces/point';

import { Mark, getCurrentFramesPerSecond, getDelta, getElapsed } from './utils/time-utils.js';
import { backBufferProps, increaseBackBufferSize, decreaseBackBufferSize } from './config.js';
import { levels } from './data/levels/levels.js';
import { render } from './raycaster.js';
import { getCurrentLevel, getGameState, getPlayer, setCurrentLevel, states } from './state.js';
import { checkEntityCollision } from './utils/collision-utils.js';
import { getLevelName } from './utils/level-utils.js';
import { Rectangle } from './interfaces/rectangle.js';
import { hasTimer, registerTimer, updateTimers } from './utils/timer-utils.js';

// Globals
let backBufferCanvas: HTMLCanvasElement;
let backBuffer: CanvasRenderingContext2D;
let frontBufferCanvas: HTMLCanvasElement;
let frontBuffer: CanvasRenderingContext2D;
let frontBufferProps: Rectangle;

// States
let pause: boolean = false;
let debug: boolean = false;

// TODO: Clean this up.
let rotateLeft = false;
let rotateRight = false;
let moveForwards = false;
let moveBackwards = false;
let interact = false;

let score = 0;
const rotationSpeed = 3.1; // Radians per second
const movementSpeed = 2.5; // Cells per second

function createThrottleTimer(wait: number): Timer {
  return (delta: number) => {
    return (wait -= delta) < 0;
  };
}

function update(elapsed: number): void {
  const player = getPlayer();
  if (moveForwards) player.move(movementSpeed * elapsed, getCurrentLevel());
  if (moveBackwards) player.move(-(movementSpeed / 2) * elapsed, getCurrentLevel());
  if (rotateLeft) player.rotate(-rotationSpeed * elapsed);
  if (rotateRight) player.rotate(rotationSpeed * elapsed);

  if (interact && !hasTimer('interact')) {
    player.interact(getCurrentLevel());
    registerTimer('interact', createThrottleTimer(0.25));
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

    // Clear the screen
    frontBuffer.fillStyle = 'black';
    frontBuffer.fillRect(0, 0, frontBufferCanvas.width, frontBufferCanvas.height);

    const delta = getDelta();

    switch (getGameState()) {
      case states.LOADING:
        frontBuffer.fillStyle = 'black';
        frontBuffer.fillRect(frontBufferProps.x, frontBufferProps.y, frontBufferProps.width, frontBufferProps.height);
        frontBuffer.font = '24px serif';
        frontBuffer.textBaseline = 'middle';
        frontBuffer.textAlign = 'center';
        frontBuffer.fillStyle = 'white';
        frontBuffer.fillText(`${getLevelName(getCurrentLevel())}`, frontBufferProps.x + frontBufferProps.width / 2, frontBufferProps.y + frontBufferProps.height / 2);
        break;

      case states.LOADED:
        updateTimers(delta);
        update(delta);
        render(backBuffer, getPlayer(), getCurrentLevel());
        frontBuffer.drawImage(backBufferCanvas, 0, 0, backBufferProps.width, backBufferProps.height, frontBufferProps.x, frontBufferProps.y, frontBufferProps.width, frontBufferProps.height);
        frontBuffer.font = '24px serif';
        frontBuffer.textBaseline = 'top';
        frontBuffer.fillStyle = 'white';
        frontBuffer.textAlign = 'end';
        frontBuffer.fillText(`${score}`, frontBufferProps.x + frontBufferProps.width - 10, frontBufferProps.y + 10);
        break;
    }

    // If 'debug' is enabled, print various stats.
    if (debug) {
      const pos: Point = {
        x: frontBufferProps.x + 10,
        y: frontBufferProps.y + 10
      };
      frontBuffer.fillStyle = 'white';
      frontBuffer.font = '12px serif';
      frontBuffer.textAlign = 'start';
      frontBuffer.fillText(`Stats`, pos.x, pos.y);
      frontBuffer.fillText(`- Framerate: ${getCurrentFramesPerSecond().toFixed(2)} per second`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Frametime: ${getDelta().toFixed(4)} seconds`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Runtime:   ${getElapsed().toFixed(4)} seconds`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`Renderer`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Back:  ${backBufferProps.width} x ${backBufferProps.height}`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Front: ${frontBufferProps.width} x ${frontBufferProps.height}`, pos.x, (pos.y += 10));
      const player = getPlayer();
      frontBuffer.fillText(`Player`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Position:  (${player.x}, ${player.y})`, pos.x, (pos.y += 10));
      frontBuffer.fillText(`- Direction: (${player.dx}, ${player.dy})`, pos.x, (pos.y += 10));
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
      console.log(`code = ${event.code}`);
      break;
  }
};

window.onkeyup = (event: KeyboardEvent): void => {
  switch (event.code) {
    // Toggle pausing the main-loop
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
      break;

    case 'Equal':
      if (increaseBackBufferSize()) {
        resizeBackbuffer();
      }
      break;

    case 'Minus':
      if (decreaseBackBufferSize()) {
        resizeBackbuffer();
      }
      break;

    default:
      break;
  }
};

// Resizes the Back Buffer
function resizeBackbuffer(): void {
  backBufferCanvas.width = backBufferProps.width;
  backBufferCanvas.height = backBufferProps.height;

  // BUG: Resizing the buffer re-enables image smoothing for some reason, hence disable it again.
  backBuffer.imageSmoothingEnabled = false;
}

// Resizes the Front Buffer
function resizeFrontbuffer(): void {
  frontBufferCanvas.width = window.innerWidth;
  frontBufferCanvas.height = window.innerHeight;

  // BUG: Resizing the buffer re-enables image smoothing for some reason, hence disable it again.
  frontBuffer.imageSmoothingEnabled = false;

  const ratio = Math.min(frontBufferCanvas.width / backBufferProps.width, frontBufferCanvas.height / backBufferProps.height);
  const width = frontBufferCanvas.width - backBufferProps.width * ratio;
  const height = frontBufferCanvas.height - backBufferProps.height * ratio;

  frontBufferProps = {
    x: width / 2,
    y: height / 2,
    width: frontBufferCanvas.width - width,
    height: frontBufferCanvas.height - height
  };
}

// When the window is resized, make sure the FrontBuffer is also resized.
window.onresize = resizeFrontbuffer;

window.onload = function (): void {
  // TODO: Once support is more widespread, could investigate using an Offscreen Canvas for the backBuffer.
  backBufferCanvas = document.createElement('canvas') as HTMLCanvasElement;
  backBuffer = backBufferCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  resizeBackbuffer();

  frontBufferCanvas = document.createElement('canvas') as HTMLCanvasElement;
  frontBuffer = frontBufferCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  resizeFrontbuffer();

  document.body.appendChild(frontBufferCanvas);
  window.requestAnimationFrame(onTick);
  setCurrentLevel(levels[0], levels[0].entrance);
};
