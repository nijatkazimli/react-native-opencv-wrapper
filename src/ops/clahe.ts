import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    clahe: [clipLimit?: number, tileGridSize?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue Contrast-Limited Adaptive Histogram Equalization (`cv::CLAHE`) —
     * like `equalizeHist`, but per-tile and clipped, so it enhances local
     * contrast without blowing out noise. The image is grayscaled first, so the
     * result is single-channel.
     *
     * @param clipLimit    Contrast clip threshold (> 0). Default `2`.
     * @param tileGridSize Side length (in tiles) of the square grid the image
     *                     is divided into (>= 1). Default `8`.
     */
    clahe(clipLimit?: number, tileGridSize?: number): Pipeline<Input, Output>;
  }
}

export const claheDoc: OpDoc = {
  name: "CLAHE (Adaptive Equalization)",
  category: "histogram-tone",
  kind: "image",
  method: "clahe(clipLimit?: number, tileGridSize?: number): Pipeline",
  standalone: "clahe(input, output, clipLimit?, tileGridSize?)",
  desc: "Contrast-Limited Adaptive Histogram Equalization. Enhances local contrast per tile without blowing out noise. Result is single-channel.",
  params: [
    {
      name: "clipLimit",
      type: "number",
      req: false,
      def: "2",
      desc: "Contrast clip threshold (> 0).",
    },
    {
      name: "tileGridSize",
      type: "number",
      req: false,
      def: "8",
      desc: "Side length (in tiles) of the square grid the image is divided into (≥ 1).",
    },
  ],
  notes: "Grayscales internally; returns a single-channel image.",
};
registerOp("clahe", (clipLimit = 2, tileGridSize = 8) => ({
  clipLimit,
  tileGridSize,
}));
