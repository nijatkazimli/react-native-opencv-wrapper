import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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
