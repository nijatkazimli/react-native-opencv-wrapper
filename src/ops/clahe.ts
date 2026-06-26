import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("clahe", (clipLimit = 2, tileGridSize = 8) => ({
  clipLimit,
  tileGridSize,
}));
