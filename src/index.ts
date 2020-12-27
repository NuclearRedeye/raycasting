import { createTextElement } from './utils/utils.js';

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let terminate: boolean = false;
let start: number;

function onTick(timestamp: number) {
  if (start === undefined) {
    start = timestamp;
  }
  const elapsed = timestamp - start;

  context.clearRect(0, 0, canvas.width, canvas.height)

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

    default:
      break;
  }
}

window.onload = function(): void {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  context = canvas.getContext("2d") as CanvasRenderingContext2D;
  window.requestAnimationFrame(onTick);
};
