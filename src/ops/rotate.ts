import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Clockwise rotation angles accepted by {@link Pipeline.rotate}. */
export type RotateAngle = 90 | 180 | 270;

declare module "../core/pipeline" {
  interface OpArgsMap {
    rotate: [angle: RotateAngle];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a clockwise rotation by a right angle (`cv::rotate`).
     *
     * @param angle One of `90`, `180`, or `270` degrees clockwise.
     */
    rotate(angle: RotateAngle): Pipeline<Input, Output>;
  }
}

registerOp("rotate", (angle: RotateAngle) => ({ angle }));
