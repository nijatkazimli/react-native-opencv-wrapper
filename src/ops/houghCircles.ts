import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.houghCircles}. */
export interface HoughCirclesOptions {
  /** Inverse accumulator resolution ratio. Default `1`. */
  dp?: number;
  /** Minimum distance between detected circle centers. Default `20`. */
  minDist?: number;
  /** Upper Canny threshold used internally. Default `100`. */
  param1?: number;
  /** Accumulator threshold for centers — smaller finds more circles. Default `30`. */
  param2?: number;
  /** Minimum circle radius in pixels. Default `0` (no minimum). */
  minRadius?: number;
  /** Maximum circle radius in pixels. Default `0` (no maximum). */
  maxRadius?: number;
}

/** A detected circle in pixel coordinates. */
export interface HoughCircle {
  x: number;
  y: number;
  radius: number;
}

/** Structured result of a {@link Pipeline.houghCircles} analysis. */
export interface HoughCirclesResult {
  found: boolean;
  count: number;
  circles: HoughCircle[];
  width: number;
  height: number;
}

declare module "../core/pipeline" {
  interface Pipeline<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Detect circles with the Hough gradient method (`cv::HoughCircles`).
     * Operates on a grayscale image; it is converted automatically, but a prior
     * `gaussianBlur()` reduces false positives.
     */
    houghCircles(
      this: Pipeline<"input-set", Output>,
      options?: HoughCirclesOptions,
    ): Promise<HoughCirclesResult>;
  }
}

export const houghCirclesDoc: OpDoc = {
  name: "Hough Circle Detection",
  category: "feature-detection",
  kind: "data",
  method:
    "houghCircles(options?: { dp?: number; minDist?: number; param1?: number; param2?: number; minRadius?: number; maxRadius?: number }): Promise<HoughCirclesResult>",
  standalone: null,
  desc: "Detect circles with the Hough gradient method. Operates on grayscale (converted automatically). A prior gaussianBlur() reduces false positives.",
  params: [
    {
      name: "options.dp",
      type: "number",
      req: false,
      def: "1",
      desc: "Inverse accumulator resolution ratio.",
    },
    {
      name: "options.minDist",
      type: "number",
      req: false,
      def: "20",
      desc: "Minimum distance between detected circle centers (px).",
    },
    {
      name: "options.param1",
      type: "number",
      req: false,
      def: "100",
      desc: "Upper Canny threshold used internally.",
    },
    {
      name: "options.param2",
      type: "number",
      req: false,
      def: "30",
      desc: "Accumulator threshold for centers (smaller finds more).",
    },
    {
      name: "options.minRadius",
      type: "number",
      req: false,
      def: "0",
      desc: "Minimum circle radius (px); 0 = no minimum.",
    },
    {
      name: "options.maxRadius",
      type: "number",
      req: false,
      def: "0",
      desc: "Maximum circle radius (px); 0 = no maximum.",
    },
  ],
  returns: `{
  found: boolean,
  count: number,
  circles: Array<{ x, y, radius }>,
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("houghCircles", (options: HoughCirclesOptions = {}) => {
  const {
    dp = 1,
    minDist = 20,
    param1 = 100,
    param2 = 30,
    minRadius = 0,
    maxRadius = 0,
  } = options;
  return { dp, minDist, param1, param2, minRadius, maxRadius };
});
