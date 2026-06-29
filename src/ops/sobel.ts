import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    sobel: [
      dx: number,
      dy: number,
      ksize?: number,
      scale?: number,
      delta?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Sobel derivative (`cv::Sobel`) — directional edge detection. The
     * gradient is computed at signed precision and returned as an absolute
     * 8-bit image (`convertScaleAbs`), so it stays displayable. Operates on the
     * current channels as-is; call `gray()` first for single-channel edges.
     *
     * @param dx    Order of the derivative in x (e.g. `1`, `0`).
     * @param dy    Order of the derivative in y (e.g. `0`, `1`).
     * @param ksize Odd kernel size `1 | 3 | 5 | 7`. Default `3`.
     * @param scale Scale applied to the computed derivative. Default `1`.
     * @param delta Value added to the result before saturation. Default `0`.
     */
    sobel(
      dx: number,
      dy: number,
      ksize?: number,
      scale?: number,
      delta?: number,
    ): Pipeline<Input, Output>;
  }
}

export const sobelDoc: OpDoc = {
  name: "Sobel Derivative",
  category: "edges-gradients",
  kind: "image",
  method:
    "sobel(dx: number, dy: number, ksize?: number, scale?: number, delta?: number): Pipeline",
  standalone: "sobel(input, output, dx, dy, ksize?, scale?, delta?)",
  desc: "Directional edge detection via Sobel. The gradient is computed at signed precision and returned as an absolute 8-bit image. Call gray() first for single-channel edges.",
  params: [
    {
      name: "dx",
      type: "number",
      req: true,
      def: null,
      desc: "Derivative order in x (e.g. 1, 0).",
    },
    {
      name: "dy",
      type: "number",
      req: true,
      def: null,
      desc: "Derivative order in y (e.g. 0, 1).",
    },
    {
      name: "ksize",
      type: "number",
      req: false,
      def: "3",
      desc: "Odd kernel size: 1 | 3 | 5 | 7.",
    },
    {
      name: "scale",
      type: "number",
      req: false,
      def: "1",
      desc: "Scale applied to the derivative.",
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
registerOp(
  "sobel",
  (dx: number, dy: number, ksize = 3, scale = 1, delta = 0) => ({
    dx,
    dy,
    ksize,
    scale,
    delta,
  }),
);
