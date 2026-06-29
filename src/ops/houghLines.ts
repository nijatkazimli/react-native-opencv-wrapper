import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.houghLines}. */
export interface HoughLinesOptions {
  /** Distance resolution of the accumulator in pixels. Default `1`. */
  rho?: number;
  /** Angle resolution in radians. Default `Math.PI / 180`. */
  theta?: number;
  /** Accumulator threshold — only lines with enough votes are returned. Default `80`. */
  threshold?: number;
  /** Minimum line length; shorter segments are rejected. Default `30`. */
  minLineLength?: number;
  /** Maximum allowed gap between points on the same line. Default `10`. */
  maxLineGap?: number;
}

/** A line segment in pixel coordinates. */
export interface HoughLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Structured result of a {@link Pipeline.houghLines} analysis. */
export interface HoughLinesResult {
  found: boolean;
  count: number;
  lines: HoughLine[];
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
     * Detect line segments with the probabilistic Hough transform
     * (`cv::HoughLinesP`). Treats the image as edges, so chain `gray()` +
     * `canny()` first for best results.
     */
    houghLines(
      this: Pipeline<"input-set", Output>,
      options?: HoughLinesOptions,
    ): Promise<HoughLinesResult>;
  }
}

export const houghLinesDoc: OpDoc = {
  name: "Hough Line Detection",
  category: "feature-detection",
  kind: "data",
  method:
    "houghLines(options?: { rho?: number; theta?: number; threshold?: number; minLineLength?: number; maxLineGap?: number }): Promise<HoughLinesResult>",
  standalone: null,
  desc: "Detect line segments with the probabilistic Hough transform. Treats the image as edges; chain gray() + canny() first for best results.",
  params: [
    {
      name: "options.rho",
      type: "number",
      req: false,
      def: "1",
      desc: "Distance resolution of the accumulator (px).",
    },
    {
      name: "options.theta",
      type: "number",
      req: false,
      def: "Math.PI / 180",
      desc: "Angle resolution (rad).",
    },
    {
      name: "options.threshold",
      type: "number",
      req: false,
      def: "80",
      desc: "Accumulator threshold; only lines with enough votes are returned.",
    },
    {
      name: "options.minLineLength",
      type: "number",
      req: false,
      def: "30",
      desc: "Minimum line length; shorter segments are rejected (px).",
    },
    {
      name: "options.maxLineGap",
      type: "number",
      req: false,
      def: "10",
      desc: "Maximum allowed gap between collinear points (px).",
    },
  ],
  returns: `{
  found: boolean,
  count: number,
  lines: Array<{ x1, y1, x2, y2 }>,
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("houghLines", (options: HoughLinesOptions = {}) => {
  const {
    rho = 1,
    theta = Math.PI / 180,
    threshold = 80,
    minLineLength = 30,
    maxLineGap = 10,
  } = options;
  return { rho, theta, threshold, minLineLength, maxLineGap };
});
