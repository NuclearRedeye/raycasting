import { Texture } from '../interfaces/texture';

import { TextureState, TextureProperties } from '../enums.js';
import { textures } from '../data/textures/textures.js';

// Creates a new Texture using the specified input
function createTexture(id: number, imageUrl: string, imageWidth: number, imageHeight: number, width: number, height: number, properties: number): Texture {
  return {
    id,
    imageUrl,
    imageWidth,
    imageHeight,
    width,
    height,
    frames: imageWidth / width,
    states: imageHeight / height,
    properties,
    state: TextureState.UNLOADED
  };
}

// Checks if the texture is in the specified state.
function textureHasState(texture: Texture, state: TextureState): number {
  return texture.state & state;
}

// Checks if the specified texture has the specified property
function textureHasProperty(texture: Texture, property: TextureProperties): number {
  return texture.properties & property;
}

// Helper function to create a simple texture.
export function createTextureBasic(id: number, imageUrl: string, width: number, height: number, properties: number = TextureProperties.NONE): Texture {
  return createTexture(id, imageUrl, width, height, width, height, properties);
}

// Helper function to create a simple animated texture.
export function createTextureAnimated(id: number, imageUrl: string, width: number, height: number, frames: number, properties: number = 0): Texture {
  return createTexture(id, imageUrl, width * frames, height, width, height, properties | TextureProperties.ANIMATED);
}

// Helper function to create a basic texture with the specified number of states.
export function createTextureStateful(id: number, imageUrl: string, width: number, height: number, states: number, properties: number = 0): Texture {
  return createTexture(id, imageUrl, width, height * states, width, height, properties | TextureProperties.STATEFUL);
}

// Utility function to determine if the specified texture has loaded or not.
export function isTextureLoaded(texture: Texture): number {
  return textureHasState(texture, TextureState.LOADED);
}

// Utility function to determine if the specified texture is unloaded, and hence in a state where is can be loaded.
export function isTextureUnloaded(texture: Texture): number {
  return textureHasState(texture, TextureState.UNLOADED);
}

// Checks if the specified texture is animated.
export function isTextureAnimated(texture: Texture): number {
  return textureHasProperty(texture, TextureProperties.ANIMATED);
}

// Checks if the specified texture is stateful.
export function isTextureStateful(texture: Texture): number {
  return textureHasProperty(texture, TextureProperties.STATEFUL);
}

// Gets the specified texture by Id.
export function getTextureById(id: number): Texture {
  // FIXME: This is potentially unsafe.
  return textures[id - 1];
}

// Loads the specified image, decodes and copys it to an offscreen canvas and encapsulates it in a Texture object.
export async function loadTexture(texture: Texture): Promise<Texture> {
  // Check that the texture has not already been loaded.
  if (isTextureLoaded(texture)) {
    return texture;
  }

  // Check that the texture is in a state where it can be loaded.
  if (isTextureUnloaded(texture)) {
    return texture;
  }

  // Update the state of the of the Texture.
  texture.state = TextureState.LOADING;

  // Create an image resource, and fetch and load the image.
  const image: HTMLImageElement = document.createElement('img');
  image.src = texture.imageUrl;
  await image.decode();

  // Create an offscreen canvas.
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = texture.imageWidth;
  canvas.height = texture.imageHeight;

  // Blit the image to the the canvas.
  // NOTE: Using a Canvas as a source for drawImage should be faster than using an Image.
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.fillStyle = 'transparent';
  context.fillRect(0, 0, texture.imageWidth, texture.imageHeight);
  context.drawImage(image, 0, 0, texture.imageWidth, texture.imageHeight);

  // Store the raw pixel data
  // NOTE: Store the raw rgba for the image in a memory buffer so that certain single pixel draw operations can be optimised.
  const buffer = context.getImageData(0, 0, texture.imageWidth, texture.imageHeight).data;

  // Update the texture with handles to the canvas and buffer.
  texture.canvas = canvas;
  texture.buffer = buffer;

  // Update the state of the of the Texture.
  texture.state = TextureState.LOADED;

  // Return the updated texture.
  return texture;
}
