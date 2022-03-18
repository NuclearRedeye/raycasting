import { TextureState, TextureProperties } from '../enums';

export interface Texture {
  id: number; // The ID for this texture.
  imageUrl: string; // Source image for the texture, e.g. 'image.png'.
  imageWidth: number; // The width, in pixels, of the Image.
  imageHeight: number; // The height, in pixels, of the Image.
  width: number; // The width, in pixels, of a single frame of the Texture.
  height: number; // The height, in pixels, of a single frame of the Texture.
  states: number; // The number of states the texture has.
  frames: number; // The number of animation frames the texture has.
  state: TextureState; // Flags that store the current status of the Texture.
  properties: TextureProperties; // Flags to store any special properties of the texture.
  canvas?: HTMLCanvasElement; // Handle to the Offscreen Canvas for this Texture data.
  buffer?: Uint8ClampedArray; // Raw pixel data for the Texture.
}
