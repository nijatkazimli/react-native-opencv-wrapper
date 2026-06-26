import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Point2D } from "./drawPolygon";

/** Four `[x, y]` points, in order, describing a quadrilateral. */
export type Quad = readonly [Point2D, Point2D, Point2D, Point2D];

declare module "../core/pipeline" {
  interface OpArgsMap {
    warpPerspective: [
      srcPoints: Quad,
      dstPoints: Quad,
      width?: number,
      height?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a perspective warp (`cv::warpPerspective`) that maps the four
     * `srcPoints` onto the four `dstPoints` — e.g. to deskew/flatten a document
     * whose corners you found with `detectDocument`.
     *
     * @param srcPoints Four source `[x, y]` corners (in the current image).
     * @param dstPoints Four destination `[x, y]` corners (in the output).
     * @param width     Output width in px (> 0). Defaults to the current width.
     * @param height    Output height in px (> 0). Defaults to the current
     *                  height.
     */
    warpPerspective(
      srcPoints: Quad,
      dstPoints: Quad,
      width?: number,
      height?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "warpPerspective",
  (srcPoints: Quad, dstPoints: Quad, width?: number, height?: number) => ({
    srcPoints,
    dstPoints,
    width,
    height,
  }),
);
