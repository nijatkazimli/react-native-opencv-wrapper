import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.fitEllipse}. */
export interface FitEllipseOptions {
  /**
   * Explicit `[x, y]` points. When omitted, the largest external contour of the
   * (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** Best-fit ellipse, expressed as its bounding rotated rectangle. */
export interface Ellipse {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  /** Rotation in degrees, as returned by `cv::fitEllipse`. */
  angle: number;
}

/** Structured result of a {@link Pipeline.fitEllipse} analysis. */
export interface FitEllipseResult {
  /** `true` when at least 5 points were available to fit. */
  found: boolean;
  ellipse: Ellipse | null;
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
     * Best-fit ellipse of the given points, or of the largest contour when no
     * points are supplied (`cv::fitEllipse`). Requires at least 5 points.
     */
    fitEllipse(
      this: Pipeline<"input-set", Output>,
      options?: FitEllipseOptions,
    ): Promise<FitEllipseResult>;
  }
}

export const fitEllipseDoc: OpDoc = {
  name: "Fit Ellipse",
  category: "contours-shape",
  kind: "data",
  method:
    "fitEllipse(options?: { points?: [x, y][] }): Promise<FitEllipseResult>",
  standalone: null,
  desc: "Best-fit ellipse expressed as a bounding rotated rectangle. Requires at least 5 points.",
  params: [
    {
      name: "options.points",
      type: "readonly [number, number][]",
      req: false,
      def: "undefined",
      desc: "Explicit [x, y] points; when omitted, the largest external contour is used (needs ≥ 5 points).",
    },
  ],
  returns: `{
  found: boolean,
  ellipse: { centerX, centerY, width, height, angle } | null,
  width: number,
  height: number
}`,
  notes: "Requires at least 5 points.",
};
registerDataOp("fitEllipse", (options: FitEllipseOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
