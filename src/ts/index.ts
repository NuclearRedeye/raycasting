import { Mark, getCurrentFramesPerSecond, getDelta, getElapsed } from './utils/time-utils.js';
import { backBufferProps } from './config.js';
import { levels } from './data/levels/levels.js';
import { render } from './raycaster.js';
import { getCurrentLevel, getGameState, getPlayer, setCurrentLevel, states } from './state.js';
import { checkEntityCollision } from './utils/collision-utils.js';
import { getLevelName } from './utils/level-utils.js';
import { Rectangle } from './interfaces/rectangle.js';
import { updateTimers } from './utils/timer-utils.js';

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
let interactCooldown = 0;
const interactPerSecond = 2;

let score = 0;
const rotationSpeed = 1.0;
const movementSpeed = 2.0;

function update(elapsed: number): void {
  // FIXME: Update this to register a timer
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
      frontBuffer.fillStyle = 'white';
      frontBuffer.font = '12px serif';
      frontBuffer.textAlign = 'start';
      frontBuffer.fillText(`Current FPS: ${getCurrentFramesPerSecond().toFixed(2)}`, frontBufferProps.x + 10, frontBufferProps.y + 10);
      frontBuffer.fillText(`Previous FT: ${getDelta().toFixed(2)}`, frontBufferProps.x + 10, frontBufferProps.y + 30);
      frontBuffer.fillText(`Runtime: ${getElapsed().toFixed(2)} seconds`, frontBufferProps.x + 10, frontBufferProps.y + 50);
      const player = getPlayer();
      frontBuffer.fillText(`Player Pos: (${player.x}, ${player.y})`, frontBufferProps.x + 10, frontBufferProps.y + 70);
      frontBuffer.fillText(`Player Dir: (${player.dx}, ${player.dy})`, frontBufferProps.x + 10, frontBufferProps.y + 90);
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
      interactCooldown = 0;
      break;

    default:
      break;
  }
};

function onResize(): void {
  frontBufferCanvas.width = window.innerWidth;
  frontBufferCanvas.height = window.innerHeight;

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

window.onresize = onResize;

window.onload = function (): void {
  backBufferCanvas = document.createElement('canvas') as HTMLCanvasElement;
  backBufferCanvas.width = backBufferProps.width;
  backBufferCanvas.height = backBufferProps.height;
  backBuffer = backBufferCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  backBuffer.imageSmoothingEnabled = false;

  frontBufferCanvas = document.createElement('canvas') as HTMLCanvasElement;
  frontBuffer = frontBufferCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  frontBuffer.imageSmoothingEnabled = false;

  onResize();

  document.body.appendChild(frontBufferCanvas);
  window.requestAnimationFrame(onTick);
  setCurrentLevel(levels[0], levels[0].entrance);
};
