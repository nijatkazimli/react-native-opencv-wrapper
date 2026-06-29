import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const adaptiveThresholdDoc: OpDoc = {
  name: "Adaptive Threshold",
  category: "thresholding",
  kind: "image",
  method:
    'adaptiveThreshold(maxValue: number, blockSize: number, c: number, method?: "mean" | "gaussian", thresholdType?: "binary" | "binaryInv"): Pipeline',
  standalone:
    "adaptiveThreshold(input, output, maxValue, blockSize, c, method?, thresholdType?)",
  desc: "Per-region threshold that tracks uneven lighting; ideal for binarizing documents and text.",
  params: [
    {
      name: "maxValue",
      type: "number",
      req: true,
      def: null,
      desc: "Value assigned to passing pixels (typically 255).",
    },
    {
      name: "blockSize",
      type: "number",
      req: true,
      def: null,
      desc: "Odd neighborhood size, greater than 1.",
    },
    {
      name: "c",
      type: "number",
      req: true,
      def: null,
      desc: "Constant subtracted from the local mean / weighted sum.",
    },
    {
      name: "method",
      type: '"mean" | "gaussian"',
      req: false,
      def: '"gaussian"',
      desc: "Neighborhood weighting.",
    },
    {
      name: "thresholdType",
      type: '"binary" | "binaryInv"',
      req: false,
      def: '"binary"',
      desc: "Output mode (binary only).",
    },
  ],
  notes: "Grayscales internally; blockSize must be odd and > 1.",
};
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
