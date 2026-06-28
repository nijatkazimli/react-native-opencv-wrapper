import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Options for {@link Pipeline.minAreaRect}. */
export interface MinAreaRectOptions {
  /**
   * Explicit `[x, y]` points to bound. When omitted, the largest external
   * contour of the (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** Rotated minimum-area rectangle. */
export interface RotatedRect {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  /** Rotation in degrees, as returned by `cv::minAreaRect`. */
  angle: number;
}

/** Structured result of a {@link Pipeline.minAreaRect} analysis. */
export interface MinAreaRectResult {
  found: boolean;
  minAreaRect: RotatedRect | null;
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
     * Rotated minimum-area rectangle of the given points, or of the largest
     * contour when no points are supplied (`cv::minAreaRect`).
     */
    minAreaRect(
      this: Pipeline<"input-set", Output>,
      options?: MinAreaRectOptions,
    ): Promise<MinAreaRectResult>;
  }
}

registerDataOp("minAreaRect", (options: MinAreaRectOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
