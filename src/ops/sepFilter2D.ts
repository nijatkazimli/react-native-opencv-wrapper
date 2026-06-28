import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** A 1D filter kernel: a non-empty array of numbers. */
export type Kernel1D = readonly number[];

declare module "../core/pipeline" {
  interface OpArgsMap {
    sepFilter2D: [kernelX: Kernel1D, kernelY: Kernel1D, delta?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a separable convolution (`cv::sepFilter2D`) — applies the 1D
     * `kernelX` across each row and `kernelY` down each column. This is the
     * efficient form of any rank-1 2D kernel (Gaussian, box, derivative); make
     * one kernel `[1]` for a purely horizontal or vertical pass. Like
     * `filter2D`, the result keeps the source depth and channels.
     *
     * @param kernelX Row (horizontal) coefficients; non-empty number array.
     * @param kernelY Column (vertical) coefficients; non-empty number array.
     * @param delta   Value added to each filtered pixel. Default `0`.
     */
    sepFilter2D(
      kernelX: Kernel1D,
      kernelY: Kernel1D,
      delta?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "sepFilter2D",
  (kernelX: Kernel1D, kernelY: Kernel1D, delta = 0) => ({
    kernelX,
    kernelY,
    delta,
  }),
);
