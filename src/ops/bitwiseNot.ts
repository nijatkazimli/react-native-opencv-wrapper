import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    bitwiseNot: [];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a per-pixel bitwise inversion (`cv::bitwise_not`). On a binary
     * mask this swaps foreground and background (`0 ↔ 255`).
     */
    bitwiseNot(): Pipeline<Input, Output>;
  }
}

registerOp("bitwiseNot");
