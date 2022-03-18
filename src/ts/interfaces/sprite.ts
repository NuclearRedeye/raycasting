export interface Sprite {
  x: number;
  y: number;
  active: boolean;
  scale: number;
  textureId: number;
  properties: number;
  distance?: number;
}
