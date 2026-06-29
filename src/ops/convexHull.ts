import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Options for {@link Pipeline.convexHull}. */
export interface ConvexHullOptions {
  /**
   * Explicit `[x, y]` points. When omitted, the largest external contour of the
   * (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** Structured result of a {@link Pipeline.convexHull} analysis. */
export interface ConvexHullResult {
  found: boolean;
  /** Hull vertices in order (`cv::convexHull`). Empty when nothing was found. */
  hull: { x: number; y: number }[];
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
     * Convex hull of the given points, or of the largest contour when no points
     * are supplied (`cv::convexHull`).
     */
    convexHull(
      this: Pipeline<"input-set", Output>,
      options?: ConvexHullOptions,
    ): Promise<ConvexHullResult>;
  }
}

registerDataOp("convexHull", (options: ConvexHullOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
