import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const equalizeHistDoc: OpDoc = {
  name: "Histogram Equalization",
  category: "histogram-tone",
  kind: "image",
  method: "equalizeHist(): Pipeline",
  standalone: "equalizeHist(input, output)",
  desc: "Global histogram equalization to spread out intensities and boost contrast. A common pre-step for OCR/scanning. Result is single-channel.",
  params: [],
  notes: "Grayscales internally; returns a single-channel image.",
};
registerOp("equalizeHist", () => ({}));
