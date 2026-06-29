import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.approxPolyDP}. */
export interface ApproxPolyDPOptions {
  /**
   * Explicit `[x, y]` points to simplify. When omitted, the largest external
   * contour of the (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
  /**
   * Approximation accuracy as a fraction of the contour perimeter. Default
   * `0.02`. Larger values simplify more aggressively.
   */
  epsilon?: number;
  /** Whether the polygon is closed. Default `true`. */
  closed?: boolean;
}

/** Structured result of a {@link Pipeline.approxPolyDP} analysis. */
export interface ApproxPolyDPResult {
  found: boolean;
  /** Simplified polygon vertices. */
  points: { x: number; y: number }[];
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
     * Simplify a polygon (the given points, or the largest contour) to its
     * corner vertices with the Ramer–Douglas–Peucker algorithm
     * (`cv::approxPolyDP`).
     */
    approxPolyDP(
      this: Pipeline<"input-set", Output>,
      options?: ApproxPolyDPOptions,
    ): Promise<ApproxPolyDPResult>;
  }
}

export const approxPolyDPDoc: OpDoc = {
  name: "Approximate Polygon",
  category: "contours-shape",
  kind: "data",
  method:
    "approxPolyDP(options?: { points?: [x, y][]; epsilon?: number; closed?: boolean }): Promise<ApproxPolyDPResult>",
  standalone: null,
  desc: "Simplify a polygon (given points or the largest contour) to corner vertices via the Ramer–Douglas–Peucker algorithm.",
  params: [
    {
      name: "options.points",
      type: "readonly [number, number][]",
      req: false,
      def: "undefined",
      desc: "Explicit [x, y] points; when omitted, the largest external contour is used.",
    },
    {
      name: "options.epsilon",
      type: "number",
      req: false,
      def: "0.02",
      desc: "Approximation accuracy as a fraction of the perimeter (larger simplifies more).",
    },
    {
      name: "options.closed",
      type: "boolean",
      req: false,
      def: "true",
      desc: "The polygon is closed.",
    },
  ],
  returns: `{
  found: boolean,
  points: Array<{ x, y }>,
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("approxPolyDP", (options: ApproxPolyDPOptions = {}) => {
  const { epsilon = 0.02, closed = true } = options;
  const params: Record<string, unknown> = { epsilon, closed };
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
