import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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
