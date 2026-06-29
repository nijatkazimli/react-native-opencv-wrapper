import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const medianBlurDoc: OpDoc = {
  name: "Median Blur",
  category: "blur-smoothing",
  kind: "image",
  method: "medianBlur(kernelSize: number): Pipeline",
  standalone: "medianBlur(input, output, kernelSize)",
  desc: "Median blur — effective against salt-and-pepper noise.",
  params: [
    {
      name: "kernelSize",
      type: "number",
      req: true,
      def: null,
      desc: "Positive odd integer aperture size (e.g. 3, 5).",
    },
  ],
  notes: "kernelSize must be odd.",
};
registerOp("medianBlur", (kernelSize: number) => ({ kernelSize }));
