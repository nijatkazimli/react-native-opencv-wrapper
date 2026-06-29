import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const rotateDoc: OpDoc = {
  name: "Rotate by Right Angle",
  category: "geometry-transforms",
  kind: "image",
  method: "rotate(angle: 90 | 180 | 270): Pipeline",
  standalone: "rotate(input, output, angle)",
  desc: "Clockwise rotation by a right angle.",
  params: [
    {
      name: "angle",
      type: "90 | 180 | 270",
      req: true,
      def: null,
      desc: "Clockwise rotation in degrees.",
    },
  ],
  notes: "Only 90, 180, and 270 are allowed.",
};
registerOp("rotate", (angle: RotateAngle) => ({ angle }));
