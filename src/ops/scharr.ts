import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    scharr: [dx: number, dy: number, scale?: number, delta?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a Scharr derivative (`cv::Scharr`) — a 3×3 operator more accurate
     * than `sobel(…, 3)` for first-order gradients. Exactly one of `dx`/`dy`
     * must be `1` and the other `0`. The signed gradient is returned as an
     * absolute 8-bit image; call `gray()` first for single-channel edges.
     *
     * @param dx    Order of the derivative in x (`1` or `0`).
     * @param dy    Order of the derivative in y (`1` or `0`).
     * @param scale Scale applied to the computed derivative. Default `1`.
     * @param delta Value added to the result before saturation. Default `0`.
     */
    scharr(
      dx: number,
      dy: number,
      scale?: number,
      delta?: number,
    ): Pipeline<Input, Output>;
  }
}

export const scharrDoc: OpDoc = {
  name: "Scharr Derivative",
  category: "edges-gradients",
  kind: "image",
  method:
    "scharr(dx: number, dy: number, scale?: number, delta?: number): Pipeline",
  standalone: "scharr(input, output, dx, dy, scale?, delta?)",
  desc: "A 3×3 Scharr derivative — more accurate than sobel(..., 3) for first-order gradients. Exactly one of dx/dy must be 1. Returned as an absolute 8-bit image.",
  params: [
    {
      name: "dx",
      type: "number",
      req: true,
      def: null,
      desc: "Derivative order in x (1 or 0).",
    },
    {
      name: "dy",
      type: "number",
      req: true,
      def: null,
      desc: "Derivative order in y (1 or 0).",
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
  notes: "Exactly one of dx, dy must be 1; returns an absolute 8-bit image.",
};
registerOp("scharr", (dx: number, dy: number, scale = 1, delta = 0) => ({
  dx,
  dy,
  scale,
  delta,
}));
