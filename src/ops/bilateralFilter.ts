import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    bilateralFilter: [
      diameter?: number,
      sigmaColor?: number,
      sigmaSpace?: number,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue an edge-preserving bilateral filter (`cv::bilateralFilter`) — it
     * smooths flat regions while keeping strong edges sharp (great for
     * denoising before thresholding).
     *
     * @param diameter   Pixel neighborhood diameter (>= 1). Default `9`.
     * @param sigmaColor Color sigma; larger mixes more distant colors. Default
     *                   `75`.
     * @param sigmaSpace Coordinate sigma; larger mixes more distant pixels.
     *                   Default `75`.
     */
    bilateralFilter(
      diameter?: number,
      sigmaColor?: number,
      sigmaSpace?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "bilateralFilter",
  (diameter = 9, sigmaColor = 75, sigmaSpace = 75) => ({
    diameter,
    sigmaColor,
    sigmaSpace,
  }),
);
