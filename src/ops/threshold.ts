import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Thresholding modes accepted by {@link Pipeline.threshold}. */
export type ThresholdType =
  | "binary"
  | "binaryInv"
  | "trunc"
  | "toZero"
  | "toZeroInv";

declare module "../core/pipeline" {
  interface OpArgsMap {
    threshold: [
      thresh: number,
      maxValue: number,
      thresholdType?: ThresholdType,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a fixed-level threshold step (`cv::threshold`).
     *
     * @param thresh        Value pixels are compared against.
     * @param maxValue      Value assigned to passing pixels (binary modes).
     * @param thresholdType Comparison mode. Default `"binary"`.
     */
    threshold(
      thresh: number,
      maxValue: number,
      thresholdType?: ThresholdType,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "threshold",
  (
    thresh: number,
    maxValue: number,
    thresholdType: ThresholdType = "binary",
  ) => ({
    thresh,
    maxValue,
    thresholdType,
  }),
);
