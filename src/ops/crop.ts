import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    crop: [x: number, y: number, width: number, height: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a crop to a rectangular region of interest. The rectangle must
     * lie fully within the current image bounds, else the pipeline rejects
     * at run time.
     *
     * @param x      Left edge (px, >= 0).
     * @param y      Top edge (px, >= 0).
     * @param width  Region width (px, > 0).
     * @param height Region height (px, > 0).
     */
    crop(
      x: number,
      y: number,
      width: number,
      height: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp("crop", (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
}));
