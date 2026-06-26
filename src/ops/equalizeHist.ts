import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    equalizeHist: [];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a global histogram equalization (`cv::equalizeHist`) to spread out
     * intensities and boost contrast — a common pre-step for OCR/scanning. The
     * image is grayscaled first, so the result is single-channel.
     */
    equalizeHist(): Pipeline<Input, Output>;
  }
}

registerOp("equalizeHist", () => ({}));
