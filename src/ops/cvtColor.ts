import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/**
 * Color-space conversions accepted by {@link Pipeline.cvtColor}. Each value
 * maps to an OpenCV `cv::ColorConversionCodes` flag. Names read
 * `<from>2<to>`; the source channel layout must match `<from>` (the pipeline
 * decodes input images as `BGR`).
 */
export type ColorConversion =
  | "BGR2GRAY"
  | "GRAY2BGR"
  | "BGR2RGB"
  | "RGB2BGR"
  | "BGR2HSV"
  | "HSV2BGR"
  | "BGR2HLS"
  | "HLS2BGR"
  | "BGR2Lab"
  | "Lab2BGR"
  | "BGR2YCrCb"
  | "YCrCb2BGR";

declare module "../core/pipeline" {
  interface OpArgsMap {
    cvtColor: [code: ColorConversion];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a color-space conversion (`cv::cvtColor`).
     *
     * A composable escape hatch for working in `HSV`, `Lab`, `YCrCb`, etc.
     * before thresholding or masking. The current image's channel layout must
     * match the source half of `code` (e.g. `"BGR2HSV"` needs a 3-channel
     * BGR image).
     *
     * @param code Conversion to apply, e.g. `"BGR2HSV"`.
     */
    cvtColor(code: ColorConversion): Pipeline<Input, Output>;
  }
}

export const cvtColorDoc: OpDoc = {
  name: "Color Space Conversion",
  category: "color-channels",
  kind: "image",
  method: "cvtColor(code: ColorConversion): Pipeline",
  standalone: "cvtColor(input, output, code)",
  desc: "Color-space conversion escape hatch. Input images are decoded as BGR; pair with inRange for HSV/Lab masking.",
  params: [
    {
      name: "code",
      type: '"BGR2GRAY" | "GRAY2BGR" | "BGR2RGB" | "RGB2BGR" | "BGR2HSV" | "HSV2BGR" | "BGR2HLS" | "HLS2BGR" | "BGR2Lab" | "Lab2BGR" | "BGR2YCrCb" | "YCrCb2BGR"',
      req: true,
      def: null,
      desc: "Conversion code; the source layout must match the <from> half.",
    },
  ],
  notes: "Input images are always decoded as BGR.",
};
registerOp("cvtColor", (code: ColorConversion) => ({ code }));
