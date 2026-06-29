import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const warpPerspectiveDoc: OpDoc = {
  name: "Perspective Warp",
  category: "geometry-transforms",
  kind: "image",
  method:
    "warpPerspective(srcPoints: [x, y][], dstPoints: [x, y][], width?: number, height?: number): Pipeline",
  standalone:
    "warpPerspective(input, output, srcPoints, dstPoints, width?, height?)",
  desc: "Perspective warp mapping four source points to four destination points. Deskew or flatten detected documents.",
  params: [
    {
      name: "srcPoints",
      type: "readonly [number, number][]",
      req: true,
      def: null,
      desc: "Four source [x, y] corners in the current image.",
    },
    {
      name: "dstPoints",
      type: "readonly [number, number][]",
      req: true,
      def: null,
      desc: "Four destination [x, y] corners in the output.",
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
  notes: "Requires exactly 4 source and 4 destination points.",
};
registerOp(
  "warpPerspective",
  (srcPoints: Quad, dstPoints: Quad, width?: number, height?: number) => ({
    srcPoints,
    dstPoints,
    width,
    height,
  }),
);
