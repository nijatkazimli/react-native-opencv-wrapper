import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const thresholdDoc: OpDoc = {
  name: "Fixed-Level Threshold",
  category: "thresholding",
  kind: "image",
  method:
    'threshold(thresh: number, maxValue: number, thresholdType?: "binary" | "binaryInv" | "trunc" | "toZero" | "toZeroInv"): Pipeline',
  standalone: "threshold(input, output, thresh, maxValue, thresholdType?)",
  desc: "The simplest binarization: compare each pixel against a fixed level. Grayscaled first; result is single-channel.",
  params: [
    {
      name: "thresh",
      type: "number",
      req: true,
      def: null,
      desc: "Value each pixel is compared against.",
    },
    {
      name: "maxValue",
      type: "number",
      req: true,
      def: null,
      desc: "Value assigned to passing pixels (binary modes).",
    },
    {
      name: "thresholdType",
      type: '"binary" | "binaryInv" | "trunc" | "toZero" | "toZeroInv"',
      req: false,
      def: '"binary"',
      desc: "Comparison mode.",
    },
  ],
  notes: "Grayscales internally; returns a single-channel image.",
};
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
