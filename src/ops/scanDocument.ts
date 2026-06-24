import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    scanDocument: [];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Detect the largest document-like quadrilateral in the image and return a
     * top-down, perspective-corrected (deskewed) crop of it — a one-call
     * document scanner.
     *
     * Internally: grayscale → blur → Canny → dilate → largest convex 4-point
     * contour → `cv::getPerspectiveTransform` + `cv::warpPerspective`. The
     * output size is derived from the detected edge lengths.
     *
     * Rejects with code `opencv_document_not_found` when no suitable
     * quadrilateral is detected (e.g. low contrast or the document fills the
     * frame with no visible border).
     */
    scanDocument(): Pipeline<Input, Output>;
  }
}

registerOp("scanDocument");
