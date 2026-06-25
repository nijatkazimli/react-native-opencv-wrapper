import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("filter2D", (kernel: Kernel) => ({ kernel }));
