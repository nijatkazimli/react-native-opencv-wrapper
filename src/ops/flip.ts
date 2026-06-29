import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Flip directions accepted by {@link Pipeline.flip}. */
export type FlipDirection = "horizontal" | "vertical" | "both";

declare module "../core/pipeline" {
  interface OpArgsMap {
    flip: [direction: FlipDirection];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a flip step (`cv::flip`).
     *
     * @param direction `"horizontal"` mirrors left/right, `"vertical"` mirrors
     *                  top/bottom, `"both"` does both (180° point reflection).
     */
    flip(direction: FlipDirection): Pipeline<Input, Output>;
  }
}

export const flipDoc: OpDoc = {
  name: "Flip / Mirror",
  category: "geometry-transforms",
  kind: "image",
  method: 'flip(direction: "horizontal" | "vertical" | "both"): Pipeline',
  standalone: "flip(input, output, direction)",
  desc: "Flip the image in one or both directions.",
  params: [
    {
      name: "direction",
      type: '"horizontal" | "vertical" | "both"',
      req: true,
      def: null,
      desc: '"horizontal" mirrors left/right, "vertical" mirrors top/bottom, "both" is a 180° point reflection.',
    },
  ],
  notes: null,
};
registerOp("flip", (direction: FlipDirection) => ({ direction }));
