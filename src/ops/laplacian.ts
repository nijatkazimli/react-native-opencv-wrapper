import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    laplacian: [ksize?: number, scale?: number, delta?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Laplacian (`cv::Laplacian`) — an isotropic second-derivative edge
     * detector. The signed response is returned as an absolute 8-bit image
     * (`convertScaleAbs`); call `gray()` first for single-channel edges.
     *
     * @param ksize Odd aperture size `1 | 3 | 5 | 7`. `1` uses the 3×3 kernel
     *              `[[0,1,0],[1,-4,1],[0,1,0]]`. Default `1`.
     * @param scale Scale applied to the computed derivative. Default `1`.
     * @param delta Value added to the result before saturation. Default `0`.
     */
    laplacian(
      ksize?: number,
      scale?: number,
      delta?: number,
    ): Pipeline<Input, Output>;
  }
}

export const laplacianDoc: OpDoc = {
  name: "Laplacian Edge Detection",
  category: "edges-gradients",
  kind: "image",
  method: "laplacian(ksize?: number, scale?: number, delta?: number): Pipeline",
  standalone: "laplacian(input, output, ksize?, scale?, delta?)",
  desc: "Isotropic second-derivative edge detector. The signed response is returned as an absolute 8-bit image. Call gray() first for single-channel edges.",
  params: [
    {
      name: "ksize",
      type: "number",
      req: false,
      def: "1",
      desc: "Odd aperture size 1 | 3 | 5 | 7; 1 uses a 3×3 [[0,1,0],[1,-4,1],[0,1,0]] kernel.",
    },
    {
      name: "scale",
      type: "number",
      req: false,
      def: "1",
      desc: "Scale applied to the computed derivative.",
    },
    {
      name: "delta",
      type: "number",
      req: false,
      def: "0",
      desc: "Value added before saturation.",
    },
  ],
  notes: "ksize must be odd; returns an absolute 8-bit image.",
};
registerOp("laplacian", (ksize = 1, scale = 1, delta = 0) => ({
  ksize,
  scale,
  delta,
}));
