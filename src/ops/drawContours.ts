import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
import type { Color } from "./drawRect";

/** Styling options for {@link Pipeline.drawContours}. */
export interface DrawContoursOptions {
  /** Contour color as `[r, g, b]` (0–255). Default green `[0, 255, 0]`. */
  color?: Color;
  /** Stroke width in px (>= 1), or `-1` to fill. Default `2`. */
  thickness?: number;
  /** Ignore contours whose area is below this value (px²). Default `0`. */
  minArea?: number;
  /** Smooth edges with anti-aliasing. Default `true`. */
  antialias?: boolean;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawContours: [options?: DrawContoursOptions];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Detect external contours of the current image (treated as a binary mask)
     * and draw them (`cv::drawContours`) onto a color copy — a quick way to
     * visualize what `findContours` found. Pair with `gray()` + `threshold()`.
     *
     * @param options Styling — `color`, `thickness` (`-1` fills), `minArea`
     *                filter, and `antialias`. See {@link DrawContoursOptions}.
     */
    drawContours(options?: DrawContoursOptions): Pipeline<Input, Output>;
  }
}

export const drawContoursDoc: OpDoc = {
  name: "Draw Contours",
  category: "drawing",
  kind: "image",
  method:
    "drawContours(options?: { color?: [r, g, b]; thickness?: number; minArea?: number; antialias?: boolean }): Pipeline",
  standalone: "drawContours(input, output, options?)",
  desc: "Detect external contours and draw them on a color copy — a quick way to visualize what findContours finds. Pair with gray() + threshold().",
  params: [
    {
      name: "options.color",
      type: "[r, g, b]",
      req: false,
      def: "[0, 255, 0]",
      desc: "Stroke color (0–255 each).",
    },
    {
      name: "options.thickness",
      type: "number",
      req: false,
      def: "2",
      desc: "Stroke width (px, ≥ 1) or -1 to fill.",
    },
    {
      name: "options.minArea",
      type: "number",
      req: false,
      def: "0",
      desc: "Ignore contours with area below this (px²).",
    },
    {
      name: "options.antialias",
      type: "boolean",
      req: false,
      def: "true",
      desc: "Smooth edges.",
    },
  ],
  notes: "Treats the image as a binary mask.",
};
registerOp("drawContours", (options: DrawContoursOptions = {}) => {
  const {
    color = [0, 255, 0],
    thickness = 2,
    minArea = 0,
    antialias = true,
  } = options;
  return { color, thickness, minArea, antialias };
});
