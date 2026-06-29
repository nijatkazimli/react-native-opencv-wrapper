import { pipeline, registerOp } from "../core/pipeline";
import type { Pipeline } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/**
 * The sub-pipeline builder handed to {@link Pipeline.applyMask}. Chain
 * transform ops on it (e.g. `cvtColor`, `inRange`, `morphologyEx`) to describe
 * how the mask is derived from the current image. Only transform ops are
 * meaningful here — there is no `input`/`output`/`run`.
 */
export type MaskBuilder = Pipeline;

declare module "../core/pipeline" {
  interface OpArgsMap {
    applyMask: [build: (mask: MaskBuilder) => MaskBuilder];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Keep only the pixels selected by a mask, zeroing the rest — the step
     * that makes {@link Pipeline.inRange} segmentation usable in a single pass.
     *
     * `build` receives a fresh sub-pipeline that runs on a copy of the current
     * image; the ops you chain must yield a single-channel mask the same size
     * as the current image. The original image (not the mask) is what flows
     * out, masked.
     *
     * ```ts
     * pipeline()
     *   .input(src)
     *   .output(out)
     *   // isolate green pixels, keep them in full color
     *   .applyMask((m) =>
     *     m.cvtColor("BGR2HSV").inRange([35, 60, 60], [85, 255, 255]),
     *   )
     *   .run();
     * ```
     *
     * @param build Configures the sub-pipeline that produces the mask.
     */
    applyMask(
      build: (mask: MaskBuilder) => MaskBuilder,
    ): Pipeline<Input, Output>;
  }
}

export const applyMaskDoc: OpDoc = {
  name: "Apply Mask (Segment & Keep)",
  category: "masking-bitwise",
  kind: "image",
  method: "applyMask(build: (mask: Pipeline) => Pipeline): Pipeline",
  standalone: null,
  desc: "Keep only the pixels selected by a mask (derived by chaining ops on a sub-pipeline copy), zeroing the rest. The original image — not the mask — flows out. Closes the loop for inRange/cvtColor segmentation in a single pass.",
  params: [
    {
      name: "build",
      type: "(mask: Pipeline) => Pipeline",
      req: true,
      def: null,
      desc: "Sub-pipeline builder; receives a fresh pipeline over a copy of the current image and must yield a single-channel mask of the same size.",
    },
  ],
  notes:
    "The sub-pipeline must yield a single-channel mask the same size as the current image.",
};
registerOp("applyMask", (build: (mask: MaskBuilder) => MaskBuilder) => {
  const sub = pipeline();
  build(sub);
  return { mask: sub.serializedOps() };
});
