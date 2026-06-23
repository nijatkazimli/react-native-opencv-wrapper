import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("gray");
