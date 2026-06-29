import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/**
 * Compound morphological operations accepted by {@link Pipeline.morphologyEx}.
 * (Plain `dilate`/`erode` have their own dedicated ops.)
 *
 * - `open` — erode then dilate; removes small bright specks.
 * - `close` — dilate then erode; fills small dark holes.
 * - `gradient` — dilation minus erosion; outlines edges.
 * - `tophat` — source minus its opening; isolates bright details.
 * - `blackhat` — closing minus source; isolates dark details.
 */
export type MorphOperation =
  | "open"
  | "close"
  | "gradient"
  | "tophat"
  | "blackhat";

declare module "../core/pipeline" {
  interface OpArgsMap {
    morphologyEx: [
      operation: MorphOperation,
      kernelSize: number,
      iterations?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a compound morphological transform (`cv::morphologyEx`) with a
     * square structuring element — denoise masks, close gaps, or extract
     * edges/details.
     *
     * @param operation  Which morphology to apply.
     * @param kernelSize Positive odd structuring-element size.
     * @param iterations Times to apply it. Default `1`.
     */
    morphologyEx(
      operation: MorphOperation,
      kernelSize: number,
      iterations?: number,
    ): Pipeline<Input, Output>;
  }
}

export const morphologyExDoc: OpDoc = {
  name: "Compound Morphology",
  category: "morphology",
  kind: "image",
  method:
    'morphologyEx(operation: "open" | "close" | "gradient" | "tophat" | "blackhat", kernelSize: number, iterations?: number): Pipeline',
  standalone: "morphologyEx(input, output, operation, kernelSize, iterations?)",
  desc: "Denoise masks, close gaps, or extract edges/details. open = erode+dilate; close = dilate+erode; gradient = dilation−erosion; tophat = src−open; blackhat = close−src.",
  params: [
    {
      name: "operation",
      type: '"open" | "close" | "gradient" | "tophat" | "blackhat"',
      req: true,
      def: null,
      desc: "Compound morphology to apply.",
    },
    {
      name: "kernelSize",
      type: "number",
      req: true,
      def: null,
      desc: "Positive odd structuring-element size.",
    },
    {
      name: "iterations",
      type: "number",
      req: false,
      def: "1",
      desc: "Times to apply.",
    },
  ],
  notes: "kernelSize must be odd; square structuring element only.",
};
registerOp(
  "morphologyEx",
  (operation: MorphOperation, kernelSize: number, iterations: number = 1) => ({
    operation,
    kernelSize,
    iterations,
  }),
);
