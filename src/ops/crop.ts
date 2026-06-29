import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    crop: [x: number, y: number, width: number, height: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a crop to a rectangular region of interest. The rectangle must
     * lie fully within the current image bounds, else the pipeline rejects
     * at run time.
     *
     * @param x      Left edge (px, >= 0).
     * @param y      Top edge (px, >= 0).
     * @param width  Region width (px, > 0).
     * @param height Region height (px, > 0).
     */
    crop(
      x: number,
      y: number,
      width: number,
      height: number,
    ): Pipeline<Input, Output>;
  }
}

export const cropDoc: OpDoc = {
  name: "Crop / Region of Interest",
  category: "geometry-transforms",
  kind: "image",
  method: "crop(x: number, y: number, width: number, height: number): Pipeline",
  standalone: "crop(input, output, x, y, width, height)",
  desc: "Crop to a rectangular region of interest. The rectangle must lie fully within the image bounds.",
  params: [
    {
      name: "x",
      type: "number",
      req: true,
      def: null,
      desc: "Left edge (px, ≥ 0).",
    },
    {
      name: "y",
      type: "number",
      req: true,
      def: null,
      desc: "Top edge (px, ≥ 0).",
    },
    {
      name: "width",
      type: "number",
      req: true,
      def: null,
      desc: "Region width (px, > 0).",
    },
    {
      name: "height",
      type: "number",
      req: true,
      def: null,
      desc: "Region height (px, > 0).",
    },
  ],
  notes: "Rejects at runtime if the rectangle extends outside the image.",
};
registerOp("crop", (x: number, y: number, width: number, height: number) => ({
  x,
  y,
  width,
  height,
}));
