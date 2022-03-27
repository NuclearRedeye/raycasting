import { Level } from '../../interfaces/level';

import { SpriteProperties } from '../../enums.js';
import {
  createFloor as f,
  createSimpleWall as sw,
  createWall as w,
  createInvisibleWall as i,
  createSimpleSwitchToggle as sst,
  createSwitchToggle as st,
  createSimpleSwitchCycler as ssc,
  createThinWall as tw,
  createDoor as d
} from '../../utils/cell-utils.js';
import { createSpriteBasic as sb } from '../../utils/sprite-utils.js';

export const level00: Level = {
  depth: 0,
  name: 'Playground',
  entrance: {
    x: 5,
    y: 1,
    angle: 90
  },
  exit: {
    x: 5,
    y: 5,
    angle: 270
  },
  floor: 2,
  data: [
    [i(2), i(2), sw(5), i(2), i(2), i(2), i(2), i(2), i(2), i(2)],
    [i(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), i(2)],
    [i(2), f(2), f(2), f(5), f(5), f(2), f(2), f(2), st([4, 1, 1, 1, 1, 1]), i(2)],
    [i(2), f(2), f(2), f(5), f(5), sw(2), d(2), sw(2), f(2), i(2)],
    [i(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), i(2)],
    [sw(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), sw(2)],
    [ssc(10), f(2), f(2), w([6, 7, 8, 9, 2, 2]), f(2), f(2), f(2), w([2, 5, 2, 5, 2, 2]), f(2), sw(2)],
    [d(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), tw(2)],
    [sw(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), f(2), sw(2)],
    [sw(1), sw(1), sw(5), sw(1), sst(4), sw(2), tw(2), sw(2), sw(2), sw(2)]
  ],
  objects: [],
  sprites: [sb(4.5, 5.5, 11, 0.25, SpriteProperties.ALIGN_BOTTOM), sb(5.5, 5.5, 5, 1), sb(6.5, 5.5, 11, 0.25, SpriteProperties.ALIGN_BOTTOM | SpriteProperties.STATIC), sb(7.5, 5.5, 5, 0.25, SpriteProperties.ALIGN_TOP)],
  enemies: []
};
