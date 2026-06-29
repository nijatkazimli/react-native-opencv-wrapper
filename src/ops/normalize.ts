import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const normalizeDoc: OpDoc = {
  name: "Intensity Normalization",
  category: "histogram-tone",
  kind: "image",
  method:
    'normalize(alpha?: number, beta?: number, normType?: "minmax" | "l1" | "l2" | "inf"): Pipeline',
  standalone: "normalize(input, output, alpha?, beta?, normType?)",
  desc: "Intensity normalization. minmax stretches to [alpha, beta]; norms scale so the array norm equals alpha.",
  params: [
    {
      name: "alpha",
      type: "number",
      req: false,
      def: "0",
      desc: "Lower bound (minmax) or target norm value (l1/l2/inf).",
    },
    {
      name: "beta",
      type: "number",
      req: false,
      def: "255",
      desc: "Upper bound (minmax only; ignored for norms).",
    },
    {
      name: "normType",
      type: '"minmax" | "l1" | "l2" | "inf"',
      req: false,
      def: '"minmax"',
      desc: "Normalization mode.",
    },
  ],
  notes: null,
};
registerOp(
  "normalize",
  (alpha = 0, beta = 255, normType: NormType = "minmax") => ({
    alpha,
    beta,
    normType,
  }),
);
