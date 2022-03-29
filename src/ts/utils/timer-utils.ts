import { Timer } from '../interfaces/timer';

const timers = new Map<string, Timer>();

// Registers a new timer, default behavior is to overwrite any existing timers.
export function registerTimer(id: string, timer: Timer, replace: boolean = true): void {
  if (!timers.has(id) || replace) {
    timers.set(id, timer);
  }
}

// Removes a timer
export function deregisterTimer(id: string): void {
  if (timers.has(id)) {
    timers.delete(id);
  }
}

// Returns true if a timer with the specified id exists.
export function hasTimer(id: string): boolean {
  return timers.has(id);
}

// Iterates over and updates all timers
export function updateTimers(delta: number): void {
  for (const [id, timer] of timers) {
    const expired = timer(delta);
    if (expired) {
      timers.delete(id);
    }
  }
}
