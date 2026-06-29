import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Options for {@link Pipeline.calcHist}. */
export interface CalcHistOptions {
  /** Number of histogram bins (1–256). Default `256`. */
  bins?: number;
  /** Channel index to histogram. Default `0` (grayscale intensity). */
  channel?: number;
}

/** Structured result of a {@link Pipeline.calcHist} analysis. */
export interface CalcHistResult {
  /** Number of bins returned. */
  bins: number;
  /** Channel the histogram was computed over. */
  channel: number;
  /** Pixel count per bin (`cv::calcHist`), length `bins`. */
  histogram: number[];
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
     * Intensity histogram of one channel (`cv::calcHist`) over the `[0, 256)`
     * range, quantized into `bins` buckets.
     */
    calcHist(
      this: Pipeline<"input-set", Output>,
      options?: CalcHistOptions,
    ): Promise<CalcHistResult>;
  }
}

registerDataOp("calcHist", (options: CalcHistOptions = {}) => {
  const { bins = 256, channel = 0 } = options;
  return { bins, channel };
});
