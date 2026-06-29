import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    dilate: [kernelSize: number, iterations?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a morphological dilation (`cv::dilate`) with a square structuring
     * element.
     *
     * @param kernelSize Positive odd integer side length of the kernel.
     * @param iterations Times to apply the operation. Default 1.
     */
    dilate(kernelSize: number, iterations?: number): Pipeline<Input, Output>;
  }
}

export const dilateDoc: OpDoc = {
  name: "Dilation",
  category: "morphology",
  kind: "image",
  method: "dilate(kernelSize: number, iterations?: number): Pipeline",
  standalone: "dilate(input, output, kernelSize, iterations?)",
  desc: "Morphological dilation with a square structuring element. Expands foreground regions.",
  params: [
    {
      name: "kernelSize",
      type: "number",
      req: true,
      def: null,
      desc: "Positive odd integer side length of the kernel.",
    },
    {
      name: "iterations",
      type: "number",
      req: false,
      def: "1",
      desc: "Times to apply the operation.",
    },
  ],
  notes: "kernelSize must be odd.",
};
registerOp("dilate", (kernelSize: number, iterations = 1) => ({
  kernelSize,
  iterations,
}));
