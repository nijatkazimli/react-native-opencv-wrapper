import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Contour retrieval mode (subset of `cv::RetrievalModes`). */
export type ContourMode = "external" | "list";

/** Options for {@link Pipeline.findContours}. */
export interface FindContoursOptions {
  /**
   * Which contours to keep. `"external"` (default) returns only the outermost
   * contours; `"list"` returns every contour with no hierarchy.
   */
  mode?: ContourMode;
  /** Discard contours whose area is below this value (px²). Default `0`. */
  minArea?: number;
  /**
   * Polygon approximation tolerance as a fraction of each contour's perimeter
   * (`cv::approxPolyDP`). `0` (default) keeps the raw contour points; a small
   * value such as `0.02` simplifies them to corner points.
   */
  epsilon?: number;
}

/** A point in pixel coordinates. */
export interface ContourPoint {
  x: number;
  y: number;
}

/** Axis-aligned bounding box of a contour. */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rotated minimum-area rectangle of a contour. */
export interface MinAreaRect {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  /** Rotation in degrees, as returned by `cv::minAreaRect`. */
  angle: number;
}

/** A single contour and its derived shape metrics. */
export interface Contour {
  /** Contour area in px² (`cv::contourArea`). */
  area: number;
  /** Boundary points (raw, or simplified when `epsilon` > 0). */
  points: ContourPoint[];
  /** Axis-aligned bounds (`cv::boundingRect`). */
  boundingBox: BoundingBox;
  /** Rotated minimum-area bounds (`cv::minAreaRect`). */
  minAreaRect: MinAreaRect;
}

/** Structured result of a {@link Pipeline.findContours} analysis. */
export interface FindContoursResult {
  /** `true` when at least one contour passed the `minArea` filter. */
  found: boolean;
  /** Number of contours returned. */
  count: number;
  /** Contours ordered largest-area first. */
  contours: Contour[];
  /** Width of the analysed image in pixels. */
  width: number;
  /** Height of the analysed image in pixels. */
  height: number;
}

declare module "../core/pipeline" {
  interface Pipeline<
    // `Input` is required so this declaration merges with the base generic, but
    // the analysis terminal constrains it via `this` instead of referencing it.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Find contours in the (optionally transformed) image and resolve with
     * each contour's points, area, bounding box, and rotated min-area rect
     * (`cv::findContours` + `boundingRect`/`minAreaRect`/`contourArea`).
     *
     * The image is treated as a binary mask: non-zero pixels are foreground, so
     * chain `gray()` then `threshold()`/`canny()` first for clean shapes.
     *
     * Terminal analysis step: it runs queued transforms and returns data
     * instead of an image, so only an input source is required (no `output`).
     */
    findContours(
      this: Pipeline<"input-set", Output>,
      options?: FindContoursOptions,
    ): Promise<FindContoursResult>;
  }
}

export const findContoursDoc: OpDoc = {
  name: "Find Contours",
  category: "contours-shape",
  kind: "data",
  method:
    'findContours(options?: { mode?: "external" | "list"; minArea?: number; epsilon?: number }): Promise<FindContoursResult>',
  standalone: null,
  desc: "Find contours and resolve with each one's points, area, bounding box, and rotated min-area rect. Ordered largest-area first. Treats the image as a binary mask; chain gray() + threshold()/canny() first.",
  params: [
    {
      name: "options.mode",
      type: '"external" | "list"',
      req: false,
      def: '"external"',
      desc: '"external" returns outermost contours only; "list" returns every contour.',
    },
    {
      name: "options.minArea",
      type: "number",
      req: false,
      def: "0",
      desc: "Discard contours with area below this (px²).",
    },
    {
      name: "options.epsilon",
      type: "number",
      req: false,
      def: "0",
      desc: "Polygon simplification factor (0 = raw points; 0.02 ≈ corners).",
    },
  ],
  returns: `{
  found: boolean,
  count: number,
  contours: Array<{
    area: number,
    points: Array<{ x, y }>,
    boundingBox: { x, y, width, height },
    minAreaRect: { centerX, centerY, width, height, angle }
  }>,
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("findContours", (options: FindContoursOptions = {}) => {
  const { mode = "external", minArea = 0, epsilon = 0 } = options;
  return { mode, minArea, epsilon };
});
