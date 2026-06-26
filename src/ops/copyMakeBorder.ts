import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

/** Pixel-extrapolation mode for {@link Pipeline.copyMakeBorder}. */
export type BorderType =
  | "constant"
  | "replicate"
  | "reflect"
  | "reflect101"
  | "wrap";

/** Styling options for {@link Pipeline.copyMakeBorder}. */
export interface CopyMakeBorderOptions {
  /** How border pixels are derived. Default `"constant"`. */
  borderType?: BorderType;
  /**
   * Fill color as `[r, g, b]` (0–255) for `"constant"` borders; ignored by the
   * other modes. Default black `[0, 0, 0]`.
   */
  color?: Color;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    copyMakeBorder: [
      top: number,
      bottom: number,
      left: number,
      right: number,
      options?: CopyMakeBorderOptions,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a border/padding step (`cv::copyMakeBorder`), enlarging the image by
     * the given margins. Handy to pad before a convolution or to letterbox.
     *
     * @param top     Pixels added above (>= 0).
     * @param bottom  Pixels added below (>= 0).
     * @param left    Pixels added to the left (>= 0).
     * @param right   Pixels added to the right (>= 0).
     * @param options `{ borderType?, color? }` — extrapolation mode and the
     *                fill `color` used by `"constant"`. See
     *                {@link CopyMakeBorderOptions}.
     */
    copyMakeBorder(
      top: number,
      bottom: number,
      left: number,
      right: number,
      options?: CopyMakeBorderOptions,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "copyMakeBorder",
  (
    top: number,
    bottom: number,
    left: number,
    right: number,
    options: CopyMakeBorderOptions = {},
  ) => {
    const { borderType = "constant", color = [0, 0, 0] } = options;
    return { top, bottom, left, right, borderType, color };
  },
);
