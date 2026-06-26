import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("convertScaleAbs", (alpha = 1, beta = 0) => ({ alpha, beta }));
