import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    canny: [threshold1: number, threshold2: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Canny edge-detection step (`cv::Canny`). The current image is
     * converted to grayscale in-memory first if needed; the output is a
     * single-channel binary edge map.
     *
     * @param threshold1 Lower hysteresis threshold.
     * @param threshold2 Upper hysteresis threshold.
     */
    canny(threshold1: number, threshold2: number): Pipeline<Input, Output>;
  }
}

registerOp("canny", (threshold1: number, threshold2: number) => ({
  threshold1,
  threshold2,
}));
