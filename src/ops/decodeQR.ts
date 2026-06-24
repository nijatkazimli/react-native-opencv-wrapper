import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** A single corner point of a detected QR code, in pixel coordinates. */
export interface QRCorner {
  x: number;
  y: number;
}

/** One decoded QR code returned by {@link Pipeline.decodeQR}. */
export interface QRCode {
  /**
   * Decoded text payload. May be an empty string when a code is located but
   * its contents could not be decoded.
   */
  value: string;
  /** The four corner points of the code, clockwise from the top-left. */
  corners: QRCorner[];
}

/** Structured result of a {@link Pipeline.decodeQR} analysis. */
export interface DecodeQRResult {
  /** `true` when at least one QR code was detected. */
  found: boolean;
  /** Every QR code detected in the image (empty when `found` is `false`). */
  codes: QRCode[];
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
     * Detect and decode every QR code in the (optionally transformed) image
     * (`cv::QRCodeDetector::detectAndDecodeMulti`).
     *
     * This is a terminal analysis step: it runs any queued transform steps and
     * resolves with structured data instead of writing an image, so only an
     * input source is required (no `output`).
     */
    decodeQR(this: Pipeline<"input-set", Output>): Promise<DecodeQRResult>;
  }
}

registerDataOp("decodeQR");
