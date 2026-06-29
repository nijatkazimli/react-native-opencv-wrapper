import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const copyMakeBorderDoc: OpDoc = {
  name: "Copy Make Border (Padding)",
  category: "geometry-transforms",
  kind: "image",
  method:
    'copyMakeBorder(top: number, bottom: number, left: number, right: number, options?: { borderType?: "constant" | "replicate" | "reflect" | "reflect101" | "wrap"; color?: [r, g, b] }): Pipeline',
  standalone:
    "copyMakeBorder(input, output, top, bottom, left, right, options?)",
  desc: "Pad the image with margins. Handy before convolution or to letterbox.",
  params: [
    {
      name: "top",
      type: "number",
      req: true,
      def: null,
      desc: "Pixels added above (≥ 0).",
    },
    {
      name: "bottom",
      type: "number",
      req: true,
      def: null,
      desc: "Pixels added below (≥ 0).",
    },
    {
      name: "left",
      type: "number",
      req: true,
      def: null,
      desc: "Pixels added to the left (≥ 0).",
    },
    {
      name: "right",
      type: "number",
      req: true,
      def: null,
      desc: "Pixels added to the right (≥ 0).",
    },
    {
      name: "options.borderType",
      type: '"constant" | "replicate" | "reflect" | "reflect101" | "wrap"',
      req: false,
      def: '"constant"',
      desc: "Pixel extrapolation mode.",
    },
    {
      name: "options.color",
      type: "[r, g, b]",
      req: false,
      def: "[0, 0, 0]",
      desc: 'Fill color for "constant" mode (0–255 each).',
    },
  ],
  notes: null,
};
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
