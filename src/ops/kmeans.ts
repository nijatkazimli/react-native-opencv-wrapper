import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    kmeans: [k?: number, attempts?: number, iterations?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a k-means color quantization (`cv::kmeans`): every pixel is mapped
     * to the nearest of `k` dominant colors, posterizing the image.
     *
     * @param k          Number of color clusters (>= 1). Default `8`.
     * @param attempts   Times the algorithm is re-run with new seeds, keeping
     *                   the best result. Default `3`.
     * @param iterations Maximum iterations per attempt. Default `10`.
     */
    kmeans(
      k?: number,
      attempts?: number,
      iterations?: number,
    ): Pipeline<Input, Output>;
  }
}

export const kmeansDoc: OpDoc = {
  name: "K-Means Color Quantization",
  category: "segmentation",
  kind: "image",
  method:
    "kmeans(k?: number, attempts?: number, iterations?: number): Pipeline",
  standalone: "kmeans(input, output, k?, attempts?, iterations?)",
  desc: "K-means color quantization; maps every pixel to the nearest of k dominant colors. Posterizes the image.",
  params: [
    {
      name: "k",
      type: "number",
      req: false,
      def: "8",
      desc: "Number of color clusters (≥ 1).",
    },
    {
      name: "attempts",
      type: "number",
      req: false,
      def: "3",
      desc: "Re-run count; the best result is kept.",
    },
    {
      name: "iterations",
      type: "number",
      req: false,
      def: "10",
      desc: "Max iterations per attempt.",
    },
  ],
  notes: null,
};
registerOp("kmeans", (k = 8, attempts = 3, iterations = 10) => ({
  k,
  attempts,
  iterations,
}));
