import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const calcHistDoc: OpDoc = {
  name: "Calculate Histogram",
  category: "histogram-tone",
  kind: "data",
  method:
    "calcHist(options?: { bins?: number; channel?: number }): Promise<CalcHistResult>",
  standalone: null,
  desc: "Intensity histogram of one channel over [0, 256), quantized into bins buckets.",
  params: [
    {
      name: "options.bins",
      type: "number",
      req: false,
      def: "256",
      desc: "Number of histogram bins (1–256).",
    },
    {
      name: "options.channel",
      type: "number",
      req: false,
      def: "0",
      desc: "Channel index (0 = grayscale intensity).",
    },
  ],
  returns: `{
  bins: number,
  channel: number,
  histogram: number[],
  width: number,
  height: number
}`,
  notes: null,
};
registerDataOp("calcHist", (options: CalcHistOptions = {}) => {
  const { bins = 256, channel = 0 } = options;
  return { bins, channel };
});
