import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Point2D } from "./drawPolygon";

/** Three `[x, y]` points describing an affine correspondence. */
export type Triangle = readonly [Point2D, Point2D, Point2D];

declare module "../core/pipeline" {
  interface OpArgsMap {
    warpAffine: [
      srcPoints: Triangle,
      dstPoints: Triangle,
      width?: number,
      height?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue an affine warp (`cv::warpAffine`) that maps the three `srcPoints`
     * onto the three `dstPoints` — affine transforms (rotate, scale, shear,
     * translate) keep parallel lines parallel.
     *
     * @param srcPoints Three source `[x, y]` points (in the current image).
     * @param dstPoints Three destination `[x, y]` points (in the output).
     * @param width     Output width in px (> 0). Defaults to the current width.
     * @param height    Output height in px (> 0). Defaults to the current
     *                  height.
     */
    warpAffine(
      srcPoints: Triangle,
      dstPoints: Triangle,
      width?: number,
      height?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "warpAffine",
  (
    srcPoints: Triangle,
    dstPoints: Triangle,
    width?: number,
    height?: number,
  ) => ({ srcPoints, dstPoints, width, height }),
);
