import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    debug: [path: string];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Write the current intermediate image to `path` and continue the pipeline
     * unchanged — a pass-through tap for inspecting a chain step by step
     * without splitting it into separate runs.
     *
     * ```ts
     * pipeline()
     *   .input(src)
     *   .output(out)
     *   .gray()
     *   .debug("/tmp/after-gray.png")
     *   .canny(50, 150)
     *   .debug("/tmp/after-canny.png")
     *   .run();
     * ```
     *
     * The capture is encoded from the file extension of `path` (e.g. `.png`,
     * `.jpg`). It is a side effect only; the image passed to the next step is
     * identical to the one before `debug`.
     *
     * @param path Absolute file path to write the intermediate image to.
     */
    debug(path: string): Pipeline<Input, Output>;
  }
}

registerOp("debug", (path: string) => ({ path }));
