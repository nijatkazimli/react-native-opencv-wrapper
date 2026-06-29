import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const warpAffineDoc: OpDoc = {
  name: "Affine Warp",
  category: "geometry-transforms",
  kind: "image",
  method:
    "warpAffine(srcPoints: [x, y][], dstPoints: [x, y][], width?: number, height?: number): Pipeline",
  standalone:
    "warpAffine(input, output, srcPoints, dstPoints, width?, height?)",
  desc: "Affine warp mapping three source points to three destination points. Keeps parallel lines parallel (rotate, scale, shear, translate).",
  params: [
    {
      name: "srcPoints",
      type: "readonly [number, number][]",
      req: true,
      def: null,
      desc: "Three source [x, y] points in the current image.",
    },
    {
      name: "dstPoints",
      type: "readonly [number, number][]",
      req: true,
      def: null,
      desc: "Three destination [x, y] points in the output.",
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
  notes: "Requires exactly 3 source and 3 destination points.",
};
registerOp(
  "warpAffine",
  (
    srcPoints: Triangle,
    dstPoints: Triangle,
    width?: number,
    height?: number,
  ) => ({ srcPoints, dstPoints, width, height }),
);
