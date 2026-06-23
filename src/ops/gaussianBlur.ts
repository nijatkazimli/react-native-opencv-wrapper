import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    gaussianBlur: [kernelSize: number, sigmaX?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Gaussian blur (`cv::GaussianBlur`).
     *
     * @param kernelSize Positive odd integer (e.g. 3, 5, 7); used for both
     *                   width and height. Invalid values reject at run time.
     * @param sigmaX     X-direction standard deviation. `0` (default) lets
     *                   OpenCV derive it from `kernelSize`.
     */
    gaussianBlur(kernelSize: number, sigmaX?: number): Pipeline<Input, Output>;
  }
}

registerOp("gaussianBlur", (kernelSize: number, sigmaX = 0) => ({
  kernelSize,
  sigmaX,
}));
