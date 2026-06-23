import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    medianBlur: [kernelSize: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a median blur (`cv::medianBlur`), effective against salt-and-pepper
     * noise.
     *
     * @param kernelSize Positive odd integer aperture size (e.g. 3, 5).
     */
    medianBlur(kernelSize: number): Pipeline<Input, Output>;
  }
}

registerOp("medianBlur", (kernelSize: number) => ({ kernelSize }));
