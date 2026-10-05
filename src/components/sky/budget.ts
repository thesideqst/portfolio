// How much the background sky may spend. It's soft and always moving, so it doesn't
// need every device pixel: drawing it at up to 1.5x instead of 2-3x cuts the pixels
// painted each frame by half or more. Phones get a lighter sky still.

/** A phone or small tablet: touch-first, or a narrow window. */
export const isLightDevice = () =>
  window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640

/** Device-pixel ratio to draw the sky at. */
export const skyDpr = () => Math.min(window.devicePixelRatio || 1, isLightDevice() ? 1 : 1.5)
