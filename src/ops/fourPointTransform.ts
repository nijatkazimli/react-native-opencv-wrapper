import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const fourPointTransformDoc: OpDoc = {
  name: "Four-Point Transform",
  category: "geometry-transforms",
  kind: "image",
  method:
    "fourPointTransform(points: [x, y][], width?: number, height?: number): Pipeline",
  standalone: "fourPointTransform(input, output, points, width?, height?)",
  desc: "Deskew/flatten a quadrilateral to a straight rectangle — a one-call convenience over warpPerspective.",
  params: [
    {
      name: "points",
      type: "readonly [number, number][]",
      req: true,
      def: null,
      desc: "Four source [x, y] corners ordered TL, TR, BR, BL.",
    },
    {
      name: "width",
      type: "number",
      req: false,
      def: "current",
      desc: "Output width (px, > 0).",
    },
    {
      name: "height",
      type: "number",
      req: false,
      def: "current",
      desc: "Output height (px, > 0).",
    },
  ],
  notes: "Requires exactly 4 points.",
};
registerOp(
  "fourPointTransform",
  (points: Quad, width?: number, height?: number) => ({
    points: points.map(([x, y]) => [x, y]),
    width,
    height,
  }),
);
