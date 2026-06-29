import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Structured result of a {@link Pipeline.minMaxLoc} analysis. */
export interface MinMaxLocResult {
  /** Minimum intensity (single-channel; the image is converted to gray). */
  min: number;
  /** Maximum intensity. */
  max: number;
  /** Location of the minimum. */
  minLoc: { x: number; y: number };
  /** Location of the maximum. */
  maxLoc: { x: number; y: number };
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
     * Minimum and maximum intensities and their locations (`cv::minMaxLoc`).
     * The image is converted to grayscale first.
     */
    minMaxLoc(this: Pipeline<"input-set", Output>): Promise<MinMaxLocResult>;
  }
}

registerDataOp("minMaxLoc", () => ({}));
