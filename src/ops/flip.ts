import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("flip", (direction: FlipDirection) => ({ direction }));
