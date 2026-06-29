import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Interpolation modes accepted by {@link Pipeline.resize}. */
export type Interpolation = "nearest" | "linear" | "cubic" | "area";

declare module "../core/pipeline" {
  interface OpArgsMap {
    resize: [width: number, height: number, interpolation?: Interpolation];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a resize step (`cv::resize`).
     *
     * @param width         Target width in px (positive integer).
     * @param height        Target height in px (positive integer).
     * @param interpolation Sampling strategy. `"area"` is best for shrinking,
     *                      `"cubic"`/`"linear"` for enlarging. Default
     *                      `"linear"`.
     */
    resize(
      width: number,
      height: number,
      interpolation?: Interpolation,
    ): Pipeline<Input, Output>;
  }
}

export const resizeDoc: OpDoc = {
  name: "Resize",
  category: "geometry-transforms",
  kind: "image",
  method:
    'resize(width: number, height: number, interpolation?: "nearest" | "linear" | "cubic" | "area"): Pipeline',
  standalone: "resize(input, output, width, height, interpolation?)",
  desc: "Resize to target dimensions.",
  params: [
    {
      name: "width",
      type: "number",
      req: true,
      def: null,
      desc: "Target width in pixels (positive integer).",
    },
    {
      name: "height",
      type: "number",
      req: true,
      def: null,
      desc: "Target height in pixels (positive integer).",
    },
    {
      name: "interpolation",
      type: '"nearest" | "linear" | "cubic" | "area"',
      req: false,
      def: '"linear"',
      desc: 'Sampling strategy; "area" is best for shrinking, "cubic"/"linear" for enlarging.',
    },
  ],
  notes: null,
};
registerOp(
  "resize",
  (width: number, height: number, interpolation: Interpolation = "linear") => ({
    width,
    height,
    interpolation,
  }),
);
