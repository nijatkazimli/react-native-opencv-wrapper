import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.arcLength}. */
export interface ArcLengthOptions {
  /**
   * Explicit `[x, y]` points. When omitted, the largest external contour of the
   * (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
  /** Treat the point set as a closed curve. Default `true`. */
  closed?: boolean;
}

/** Structured result of a {@link Pipeline.arcLength} analysis. */
export interface ArcLengthResult {
  found: boolean;
  /** Perimeter (or curve length) in px (`cv::arcLength`). */
  length: number;
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
     * Perimeter of the given points, or of the largest contour when no points
     * are supplied (`cv::arcLength`).
     */
    arcLength(
      this: Pipeline<"input-set", Output>,
      options?: ArcLengthOptions,
    ): Promise<ArcLengthResult>;
  }
}

export const arcLengthDoc: OpDoc = {
  name: "Arc Length / Perimeter",
  category: "contours-shape",
  kind: "data",
  method:
    "arcLength(options?: { points?: [x, y][]; closed?: boolean }): Promise<ArcLengthResult>",
  standalone: null,
  desc: "Perimeter (or curve length) of the given points or the largest contour.",
  params: [
    {
      name: "options.points",
      type: "readonly [number, number][]",
      req: false,
      def: "undefined",
      desc: "Explicit [x, y] points; when omitted, the largest external contour is used.",
    },
    {
      name: "options.closed",
      type: "boolean",
      req: false,
      def: "true",
      desc: "Treat the point set as a closed curve.",
    },
  ],
  returns: `{ found: boolean, length: number, width: number, height: number }`,
  notes: null,
};
registerDataOp("arcLength", (options: ArcLengthOptions = {}) => {
  const { closed = true } = options;
  const params: Record<string, unknown> = { closed };
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
