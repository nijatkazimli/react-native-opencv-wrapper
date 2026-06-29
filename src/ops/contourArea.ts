import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.contourArea}. */
export interface ContourAreaOptions {
  /**
   * Explicit `[x, y]` points. When omitted, the largest external contour of the
   * (binary) image is used — chain `gray()` + `threshold()` first.
   */
  points?: readonly (readonly [number, number])[];
}

/** Structured result of a {@link Pipeline.contourArea} analysis. */
export interface ContourAreaResult {
  found: boolean;
  /** Enclosed area in px² (`cv::contourArea`). `0` when nothing was found. */
  area: number;
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
     * Enclosed area of the given points, or of the largest contour when no
     * points are supplied (`cv::contourArea`).
     */
    contourArea(
      this: Pipeline<"input-set", Output>,
      options?: ContourAreaOptions,
    ): Promise<ContourAreaResult>;
  }
}

export const contourAreaDoc: OpDoc = {
  name: "Contour Area",
  category: "contours-shape",
  kind: "data",
  method:
    "contourArea(options?: { points?: [x, y][] }): Promise<ContourAreaResult>",
  standalone: null,
  desc: "Enclosed area of the given points or the largest external contour.",
  params: [
    {
      name: "options.points",
      type: "readonly [number, number][]",
      req: false,
      def: "undefined",
      desc: "Explicit [x, y] points; when omitted, the largest external contour is used.",
    },
  ],
  returns: `{ found: boolean, area: number, width: number, height: number }`,
  notes: null,
};
registerDataOp("contourArea", (options: ContourAreaOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.points) {
    params.points = options.points.map(([x, y]) => [x, y]);
  }
  return params;
});
