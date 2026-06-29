import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const convexHullDoc: OpDoc = {
  name: "Convex Hull",
  category: "contours-shape",
  kind: "data",
  method:
    "convexHull(options?: { points?: [x, y][] }): Promise<ConvexHullResult>",
  standalone: null,
  desc: "Convex hull of the given points or the largest contour.",
  params: [
    {
      name: "options.points",
      type: "readonly [number, number][]",
      req: false,
      def: "undefined",
      desc: "Explicit [x, y] points; when omitted, the largest external contour is used.",
    },
  ],
  returns: `{
  found: boolean,
  hull: Array<{ x, y }>,
  width: number,
  height: number
}`,
  notes: "Hull vertices are returned in order; empty when nothing is found.",
};
registerDataOp("convexHull", (options: ConvexHullOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
