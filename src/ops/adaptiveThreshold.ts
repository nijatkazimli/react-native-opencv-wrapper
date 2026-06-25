import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Neighborhood weighting used by {@link Pipeline.adaptiveThreshold}. */
export type AdaptiveMethod = "mean" | "gaussian";

/** Output mode for {@link Pipeline.adaptiveThreshold} (only the two binary modes are valid). */
export type AdaptiveThresholdType = "binary" | "binaryInv";

declare module "../core/pipeline" {
  interface OpArgsMap {
    adaptiveThreshold: [
      maxValue: number,
      blockSize: number,
      c: number,
      method?: AdaptiveMethod,
      thresholdType?: AdaptiveThresholdType,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue an adaptive threshold (`cv::adaptiveThreshold`) — a per-region
     * threshold that tracks uneven lighting, ideal for binarizing documents
     * and text before OCR. The image is converted to grayscale first if
     * needed.
     *
     * @param maxValue      Value assigned to passing pixels (typically `255`).
     * @param blockSize     Odd neighborhood size (`> 1`) used per pixel.
     * @param c             Constant subtracted from the local mean/weighted sum.
     * @param method        Neighborhood weighting. Default `"gaussian"`.
     * @param thresholdType `"binary"` or `"binaryInv"`. Default `"binary"`.
     */
    adaptiveThreshold(
      maxValue: number,
      blockSize: number,
      c: number,
      method?: AdaptiveMethod,
      thresholdType?: AdaptiveThresholdType,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "adaptiveThreshold",
  (
    maxValue: number,
    blockSize: number,
    c: number,
    method: AdaptiveMethod = "gaussian",
    thresholdType: AdaptiveThresholdType = "binary",
  ) => ({ maxValue, blockSize, c, method, thresholdType }),
);
