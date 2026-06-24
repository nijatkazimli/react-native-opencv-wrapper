import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** A single corner of a detected document, in source-image pixel coordinates. */
export interface DocumentCorner {
  x: number;
  y: number;
}

/** Structured result of a {@link Pipeline.detectDocument} analysis. */
export interface DetectDocumentResult {
  /** `true` when a document-like quadrilateral was located. */
  found: boolean;
  /**
   * The four detected corners, ordered top-left, top-right, bottom-right,
   * bottom-left, in pixel coordinates of the (optionally transformed) source
   * image. Empty when `found` is `false`.
   */
  corners: DocumentCorner[];
  /** Width of the analysed image in pixels (the space `corners` live in). */
  width: number;
  /** Height of the analysed image in pixels (the space `corners` live in). */
  height: number;
}

declare module "../core/pipeline" {
  interface Pipeline<
    // `Input` is required so this declaration merges with the base generic, but
    // the analysis terminal constrains it via `this` instead of referencing it.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Locate the largest document-like quadrilateral in the (optionally
     * transformed) image and resolve with its four corner points — without
     * warping. Pair the returned corners with {@link width}/{@link height} to
     * draw a live edge overlay, or feed them to your own crop.
     *
     * Uses the same detector as {@link Pipeline.scanDocument} (grayscale →
     * downscale → blur → adaptive Canny → morphological close → largest convex
     * 4-point contour), so the corners match what `scanDocument` would rectify.
     *
     * This is a terminal analysis step: it runs any queued transform steps and
     * resolves with structured data instead of writing an image, so only an
     * input source is required (no `output`).
     *
     * Unlike `scanDocument`, a missing document is **not** an error — it
     * resolves with `{ found: false, corners: [] }`, which suits per-frame use.
     */
    detectDocument(
      this: Pipeline<"input-set", Output>,
    ): Promise<DetectDocumentResult>;
  }
}

registerDataOp("detectDocument");
