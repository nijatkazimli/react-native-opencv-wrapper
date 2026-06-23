import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Interpolation modes accepted by {@link Pipeline.resize}. */
export type Interpolation = "nearest" | "linear" | "cubic" | "area";

declare module "../core/pipeline" {
  interface OpArgsMap {
    resize: [width: number, height: number, interpolation?: Interpolation];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a resize step (`cv::resize`).
     *
     * @param width         Target width in px (positive integer).
     * @param height        Target height in px (positive integer).
     * @param interpolation Sampling strategy. `"area"` is best for shrinking,
     *                      `"cubic"`/`"linear"` for enlarging. Default
     *                      `"linear"`.
     */
    resize(
      width: number,
      height: number,
      interpolation?: Interpolation,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "resize",
  (width: number, height: number, interpolation: Interpolation = "linear") => ({
    width,
    height,
    interpolation,
  }),
);
