import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    gray: [];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a grayscale conversion (`cv::cvtColor`, BGR→GRAY). A no-op if the
     * current image is already single-channel.
     */
    gray(): Pipeline<Input, Output>;
  }
}

export const grayDoc: OpDoc = {
  name: "Grayscale Conversion",
  category: "color-channels",
  kind: "image",
  method: "gray(): Pipeline",
  standalone: "gray(input, output) · alias toGray(input, output)",
  desc: "Convert BGR to single-channel grayscale. No-op if the image is already single-channel.",
  params: [],
  notes: null,
};
registerOp("gray");
