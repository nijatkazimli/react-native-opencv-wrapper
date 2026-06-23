import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    erode: [kernelSize: number, iterations?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a morphological erosion (`cv::erode`) with a square structuring
     * element.
     *
     * @param kernelSize Positive odd integer side length of the kernel.
     * @param iterations Times to apply the operation. Default 1.
     */
    erode(kernelSize: number, iterations?: number): Pipeline<Input, Output>;
  }
}

registerOp("erode", (kernelSize: number, iterations = 1) => ({
  kernelSize,
  iterations,
}));
