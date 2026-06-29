import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/**
 * How the rectified document is rendered:
 * - `"color"` (default): the perspective-corrected colour crop.
 * - `"gray"`: a grayscale crop.
 * - `"bw"`: a high-contrast black-and-white "scanned paper" look produced with
 *   an adaptive threshold — ideal for printed text.
 */
export type ScanDocumentMode = "color" | "gray" | "bw";

/** Options for {@link Pipeline.scanDocument}. */
export interface ScanDocumentOptions {
  /** Output rendering mode. Default `"color"`. */
  mode?: ScanDocumentMode;
  /**
   * Force the output to a fixed width-to-height ratio (`width / height`)
   * instead of inferring it from the detected edge lengths. For example
   * `Math.SQRT1_2` (≈ 0.707) yields portrait A‑series paper proportions.
   * Must be positive.
   */
  aspectRatio?: number;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    scanDocument: [options?: ScanDocumentOptions];
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
     * Internally: grayscale → downscale → blur → adaptive Canny → morphological
     * close → largest convex 4-point contour → `cv::getPerspectiveTransform` +
     * `cv::warpPerspective`. The output size is derived from the detected edge
     * lengths unless {@link ScanDocumentOptions.aspectRatio} is given.
     *
     * Rejects with code `opencv_document_not_found` when no suitable
     * quadrilateral is detected (e.g. low contrast or the document fills the
     * frame with no visible border).
     *
     * @param options Optional output {@link ScanDocumentOptions.mode mode} and
     *                {@link ScanDocumentOptions.aspectRatio aspectRatio}.
     */
    scanDocument(options?: ScanDocumentOptions): Pipeline<Input, Output>;
  }
}

export const scanDocumentDoc: OpDoc = {
  name: "Document Scanner",
  category: "document",
  kind: "image",
  method:
    'scanDocument(options?: { mode?: "color" | "gray" | "bw"; aspectRatio?: number }): Pipeline',
  standalone: "scanDocument(input, output, options?)",
  desc: "Detect the largest document-like quadrilateral and return a top-down, perspective-corrected crop. Internally: grayscale → downscale → blur → adaptive Canny → morphological close → largest 4-point convex contour → perspective warp.",
  params: [
    {
      name: "options.mode",
      type: '"color" | "gray" | "bw"',
      req: false,
      def: '"color"',
      desc: '"bw" applies an adaptive threshold for a crisp black-and-white scan.',
    },
    {
      name: "options.aspectRatio",
      type: "number",
      req: false,
      def: "undefined",
      desc: "Force the output to a width/height ratio (must be positive); inferred from the detected edges when omitted.",
    },
  ],
  notes:
    "Rejects with opencv_document_not_found when no suitable quad is detected.",
};
registerOp("scanDocument", (options: ScanDocumentOptions = {}) => {
  const params: Record<string, unknown> = {};
  if (options.mode !== undefined) params.mode = options.mode;
  if (options.aspectRatio !== undefined)
    params.aspectRatio = options.aspectRatio;
  return params;
});
