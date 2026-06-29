import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    convertScaleAbs: [alpha?: number, beta?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a brightness/contrast adjustment (`cv::convertScaleAbs`):
     * `out = |alpha * current + beta|`, saturated to an 8-bit image. `alpha`
     * scales contrast; `beta` shifts brightness.
     *
     * @param alpha Contrast gain (multiplier). Default `1`.
     * @param beta  Brightness bias (added). Default `0`.
     */
    convertScaleAbs(alpha?: number, beta?: number): Pipeline<Input, Output>;
  }
}

export const convertScaleAbsDoc: OpDoc = {
  name: "Brightness / Contrast",
  category: "histogram-tone",
  kind: "image",
  method: "convertScaleAbs(alpha?: number, beta?: number): Pipeline",
  standalone: "convertScaleAbs(input, output, alpha?, beta?)",
  desc: "Brightness/contrast adjustment: out = |alpha · current + beta|, saturated to 8-bit.",
  params: [
    {
      name: "alpha",
      type: "number",
      req: false,
      def: "1",
      desc: "Contrast gain (multiplier).",
    },
    {
      name: "beta",
      type: "number",
      req: false,
      def: "0",
      desc: "Brightness bias (added).",
    },
  ],
  notes: null,
};
registerOp("convertScaleAbs", (alpha = 1, beta = 0) => ({ alpha, beta }));
