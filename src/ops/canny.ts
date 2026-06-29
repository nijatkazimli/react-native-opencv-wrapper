import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const cannyDoc: OpDoc = {
  name: "Canny Edge Detection",
  category: "edges-gradients",
  kind: "image",
  method: "canny(threshold1: number, threshold2: number): Pipeline",
  standalone: "canny(input, output, threshold1, threshold2)",
  desc: "Canny edge detector. The image is grayscaled in-memory first if needed; the output is a single-channel binary edge map.",
  params: [
    {
      name: "threshold1",
      type: "number",
      req: true,
      def: null,
      desc: "Lower hysteresis threshold.",
    },
    {
      name: "threshold2",
      type: "number",
      req: true,
      def: null,
      desc: "Upper hysteresis threshold.",
    },
  ],
  notes: "Grayscales internally.",
};
registerOp("canny", (threshold1: number, threshold2: number) => ({
  threshold1,
  threshold2,
}));
