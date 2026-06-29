import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** A 2D convolution kernel: a non-empty matrix of equal-length number rows. */
export type Kernel = readonly (readonly number[])[];

declare module "../core/pipeline" {
  interface OpArgsMap {
    filter2D: [kernel: Kernel];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue an arbitrary 2D convolution (`cv::filter2D`) with a custom kernel —
     * the escape hatch for filters the named ops do not cover (sharpen,
     * emboss, custom edge kernels). The result keeps the source depth and
     * channel count.
     *
     * @param kernel Convolution matrix as rows of numbers; every row must have
     *               the same length.
     */
    filter2D(kernel: Kernel): Pipeline<Input, Output>;
  }
}

export const filter2DDoc: OpDoc = {
  name: "2D Convolution (Custom Kernel)",
  category: "other",
  kind: "image",
  method: "filter2D(kernel: readonly (readonly number[])[]): Pipeline",
  standalone: "filter2D(input, output, kernel)",
  desc: "Arbitrary 2D convolution with a custom kernel — the escape hatch for sharpen, emboss, and custom edge kernels. Keeps the source depth and channels.",
  params: [
    {
      name: "kernel",
      type: "readonly (readonly number[])[]",
      req: true,
      def: null,
      desc: "Non-empty 2D matrix of equal-length rows.",
    },
  ],
  notes: "All rows must have the same length.",
};
registerOp("filter2D", (kernel: Kernel) => ({ kernel }));
