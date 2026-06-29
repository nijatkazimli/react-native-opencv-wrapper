import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const gaussianBlurDoc: OpDoc = {
  name: "Gaussian Blur",
  category: "blur-smoothing",
  kind: "image",
  method: "gaussianBlur(kernelSize: number, sigmaX?: number): Pipeline",
  standalone: "gaussianBlur(input, output, kernelSize, sigmaX?)",
  desc: "Gaussian blur with a symmetric kernel.",
  params: [
    {
      name: "kernelSize",
      type: "number",
      req: true,
      def: null,
      desc: "Positive odd integer (e.g. 3, 5, 7); used for both width and height.",
    },
    {
      name: "sigmaX",
      type: "number",
      req: false,
      def: "0",
      desc: "X-direction standard deviation; 0 lets OpenCV derive it from kernelSize.",
    },
  ],
  notes: "kernelSize must be odd.",
};
registerOp("gaussianBlur", (kernelSize: number, sigmaX = 0) => ({
  kernelSize,
  sigmaX,
}));
