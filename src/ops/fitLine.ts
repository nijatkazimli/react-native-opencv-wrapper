import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Options for {@link Pipeline.fitLine}. */
export interface FitLineOptions {
  /**
   * Explicit `[x, y]` points. When omitted, the largest external contour of the
   * (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** A line in `cv::fitLine` form: a unit direction `(vx, vy)` and a point on it. */
export interface FittedLine {
  /** Unit direction X component. */
  vx: number;
  /** Unit direction Y component. */
  vy: number;
  /** X of a point lying on the line. */
  x0: number;
  /** Y of a point lying on the line. */
  y0: number;
}

/** Structured result of a {@link Pipeline.fitLine} analysis. */
export interface FitLineResult {
  found: boolean;
  line: FittedLine | null;
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
     * Best-fit line through the given points, or through the largest contour
     * when no points are supplied (`cv::fitLine`, L2 distance).
     */
    fitLine(
      this: Pipeline<"input-set", Output>,
      options?: FitLineOptions,
    ): Promise<FitLineResult>;
  }
}

registerDataOp("fitLine", (options: FitLineOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
