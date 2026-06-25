import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp(
  "morphologyEx",
  (operation: MorphOperation, kernelSize: number, iterations: number = 1) => ({
    operation,
    kernelSize,
    iterations,
  }),
);
