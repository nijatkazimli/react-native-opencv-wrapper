import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const sepFilter2DDoc: OpDoc = {
  name: "Separable 2D Convolution",
  category: "other",
  kind: "image",
  method:
    "sepFilter2D(kernelX: readonly number[], kernelY: readonly number[], delta?: number): Pipeline",
  standalone: "sepFilter2D(input, output, kernelX, kernelY, delta?)",
  desc: "Separable convolution: apply 1D kernelX across rows and kernelY down columns — an efficient form for rank-1 2D kernels (Gaussian, box, derivative). Make one kernel [1] for a purely horizontal/vertical pass.",
  params: [
    {
      name: "kernelX",
      type: "readonly number[]",
      req: true,
      def: null,
      desc: "Row (horizontal) coefficients; non-empty.",
    },
    {
      name: "kernelY",
      type: "readonly number[]",
      req: true,
      def: null,
      desc: "Column (vertical) coefficients; non-empty.",
    },
    {
      name: "delta",
      type: "number",
      req: false,
      def: "0",
      desc: "Value added to each filtered pixel.",
    },
  ],
  notes: null,
};
registerOp(
  "sepFilter2D",
  (kernelX: Kernel1D, kernelY: Kernel1D, delta = 0) => ({
    kernelX,
    kernelY,
    delta,
  }),
);
