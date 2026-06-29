import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Structured result of a {@link Pipeline.meanStdDev} analysis. */
export interface MeanStdDevResult {
  /** Per-channel mean (`cv::meanStdDev`), one entry per image channel. */
  mean: number[];
  /** Per-channel standard deviation, one entry per image channel. */
  stddev: number[];
  /** Number of channels the statistics were computed over. */
  channels: number;
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
     * Per-channel mean and standard deviation of the current image
     * (`cv::meanStdDev`). Useful for exposure/contrast checks.
     */
    meanStdDev(this: Pipeline<"input-set", Output>): Promise<MeanStdDevResult>;
  }
}

registerDataOp("meanStdDev", () => ({}));
