import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Structured result of a {@link Pipeline.countNonZero} analysis. */
export interface CountNonZeroResult {
  /** Number of non-zero pixels (single-channel; image converted to gray). */
  count: number;
  /** Total pixel count (`width * height`). */
  total: number;
  /** `count / total`, in `[0, 1]`. */
  ratio: number;
  width: number;
  height: number;
}

declare module "../core/pipeline" {
  interface Pipeline<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Count non-zero pixels (`cv::countNonZero`) — e.g. the foreground area of
     * a binary mask. The image is converted to grayscale first.
     */
    countNonZero(
      this: Pipeline<"input-set", Output>,
    ): Promise<CountNonZeroResult>;
  }
}

registerDataOp("countNonZero", () => ({}));
