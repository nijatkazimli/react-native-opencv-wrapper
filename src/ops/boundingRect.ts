import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.boundingRect}. */
export interface BoundingRectOptions {
  /**
   * Explicit `[x, y]` points to bound. When omitted, the largest external
   * contour of the (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** Structured result of a {@link Pipeline.boundingRect} analysis. */
export interface BoundingRectResult {
  found: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
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
     * Axis-aligned bounding box of the given points, or of the largest contour
     * when no points are supplied (`cv::boundingRect`).
     */
    boundingRect(
      this: Pipeline<"input-set", Output>,
      options?: BoundingRectOptions,
    ): Promise<BoundingRectResult>;
  }
}

export const boundingRectDoc: OpDoc = {
  name: "Bounding Rectangle",
  category: "contours-shape",
  kind: "data",
  method:
    "boundingRect(options?: { points?: [x, y][] }): Promise<BoundingRectResult>",
  standalone: null,
  desc: "Axis-aligned bounding box of the given points or the largest contour.",
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
  boundingBox: { x, y, width, height } | null,
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("boundingRect", (options: BoundingRectOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
