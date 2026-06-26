import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Normalization mode for {@link Pipeline.normalize}. */
export type NormType = "minmax" | "l1" | "l2" | "inf";

declare module "../core/pipeline" {
  interface OpArgsMap {
    normalize: [alpha?: number, beta?: number, normType?: NormType];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue an intensity normalization (`cv::normalize`). With `"minmax"` the
     * values are linearly rescaled into `[alpha, beta]`; with `"l1"`/`"l2"`/
     * `"inf"` the array is scaled so its norm equals `alpha`.
     *
     * @param alpha    Lower bound (`minmax`) or target norm value. Default `0`.
     * @param beta     Upper bound for `minmax`; ignored otherwise. Default
     *                 `255`.
     * @param normType Normalization mode. Default `"minmax"`.
     */
    normalize(
      alpha?: number,
      beta?: number,
      normType?: NormType,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "normalize",
  (alpha = 0, beta = 255, normType: NormType = "minmax") => ({
    alpha,
    beta,
    normType,
  }),
);
