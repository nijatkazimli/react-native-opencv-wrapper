import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    inRange: [lower: readonly number[], upper: readonly number[]];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a per-channel range check (`cv::inRange`) producing a
     * single-channel binary mask (pixels inside `[lower, upper]` become `255`,
     * the rest `0`).
     *
     * Pair with {@link Pipeline.cvtColor} to mask by color, e.g. convert to
     * `HSV` then `inRange([35, 60, 60], [85, 255, 255])` to isolate greens.
     *
     * @param lower Inclusive lower bound per channel (1–4 components).
     * @param upper Inclusive upper bound per channel (same length as `lower`).
     */
    inRange(
      lower: readonly number[],
      upper: readonly number[],
    ): Pipeline<Input, Output>;
  }
}

export const inRangeDoc: OpDoc = {
  name: "In-Range Mask",
  category: "thresholding",
  kind: "image",
  method:
    "inRange(lower: readonly number[], upper: readonly number[]): Pipeline",
  standalone: "inRange(input, output, lower, upper)",
  desc: "Per-channel range check producing a single-channel binary mask (255 inside, 0 outside). Pair with cvtColor to mask by color (e.g. HSV green).",
  params: [
    {
      name: "lower",
      type: "readonly number[]",
      req: true,
      def: null,
      desc: "Inclusive lower bound per channel (1–4 numbers).",
    },
    {
      name: "upper",
      type: "readonly number[]",
      req: true,
      def: null,
      desc: "Inclusive upper bound per channel (same length as lower).",
    },
  ],
  notes: "lower and upper must be the same length; typically 3 for BGR.",
};
registerOp("inRange", (lower: readonly number[], upper: readonly number[]) => ({
  lower,
  upper,
}));
