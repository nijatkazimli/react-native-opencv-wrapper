import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Quad } from "./warpPerspective";

declare module "../core/pipeline" {
  interface OpArgsMap {
    fourPointTransform: [points: Quad, width?: number, height?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Deskew/flatten a quadrilateral region to a straight rectangle. Computes
     * the perspective transform from the four source `points` to the corners of
     * a `width × height` output and applies it (`cv::getPerspectiveTransform` +
     * `cv::warpPerspective`) — a one-call convenience over `warpPerspective`.
     *
     * @param points Four source `[x, y]` corners, ordered top-left, top-right,
     *               bottom-right, bottom-left.
     * @param width  Output width in px (> 0). Defaults to the current width.
     * @param height Output height in px (> 0). Defaults to the current height.
     */
    fourPointTransform(
      points: Quad,
      width?: number,
      height?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "fourPointTransform",
  (points: Quad, width?: number, height?: number) => ({
    points: points.map(([x, y]) => [x, y]),
    width,
    height,
  }),
);
