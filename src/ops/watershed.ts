import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

declare module "../core/pipeline" {
  interface OpArgsMap {
    watershed: [lineColor?: readonly [number, number, number]];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a marker-based watershed segmentation (`cv::watershed`). Markers are
     * derived automatically (Otsu threshold → distance transform → sure
     * foreground/background), and the detected region boundaries are drawn onto
     * the image.
     *
     * @param lineColor Boundary color as `[r, g, b]` (0–255). Default red
     *                  `[255, 0, 0]`.
     */
    watershed(
      lineColor?: readonly [number, number, number],
    ): Pipeline<Input, Output>;
  }
}

export const watershedDoc: OpDoc = {
  name: "Watershed Segmentation",
  category: "segmentation",
  kind: "image",
  method: "watershed(lineColor?: readonly [r, g, b]): Pipeline",
  standalone: "watershed(input, output, lineColor?)",
  desc: "Marker-based watershed segmentation. Markers are derived automatically (Otsu threshold → distance transform → sure foreground/background) and detected boundaries are drawn onto the image.",
  params: [
    {
      name: "lineColor",
      type: "readonly [r, g, b]",
      req: false,
      def: "[255, 0, 0]",
      desc: "Boundary color (0–255 each).",
    },
  ],
  notes: null,
};
registerOp(
  "watershed",
  (lineColor: readonly [number, number, number] = [255, 0, 0]) => ({
    lineColor: [lineColor[0], lineColor[1], lineColor[2]],
  }),
);
