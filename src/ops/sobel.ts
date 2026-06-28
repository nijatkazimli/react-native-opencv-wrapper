import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    sobel: [
      dx: number,
      dy: number,
      ksize?: number,
      scale?: number,
      delta?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Sobel derivative (`cv::Sobel`) — directional edge detection. The
     * gradient is computed at signed precision and returned as an absolute
     * 8-bit image (`convertScaleAbs`), so it stays displayable. Operates on the
     * current channels as-is; call `gray()` first for single-channel edges.
     *
     * @param dx    Order of the derivative in x (e.g. `1`, `0`).
     * @param dy    Order of the derivative in y (e.g. `0`, `1`).
     * @param ksize Odd kernel size `1 | 3 | 5 | 7`. Default `3`.
     * @param scale Scale applied to the computed derivative. Default `1`.
     * @param delta Value added to the result before saturation. Default `0`.
     */
    sobel(
      dx: number,
      dy: number,
      ksize?: number,
      scale?: number,
      delta?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "sobel",
  (dx: number, dy: number, ksize = 3, scale = 1, delta = 0) => ({
    dx,
    dy,
    ksize,
    scale,
    delta,
  }),
);
