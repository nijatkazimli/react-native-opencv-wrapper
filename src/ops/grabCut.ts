import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** A rectangle, as used to seed {@link Pipeline.grabCut}. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    grabCut: [rect: Rect, iterations?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a GrabCut foreground extraction (`cv::grabCut`): pixels outside
     * `rect` are treated as background and the foreground inside is segmented.
     * Background pixels in the result are set to black.
     *
     * @param rect       Rectangle (in pixels) enclosing the foreground object.
     * @param iterations Number of GrabCut iterations. Default `5`.
     */
    grabCut(rect: Rect, iterations?: number): Pipeline<Input, Output>;
  }
}

export const grabCutDoc: OpDoc = {
  name: "GrabCut Foreground Extraction",
  category: "segmentation",
  kind: "image",
  method:
    "grabCut(rect: { x: number; y: number; width: number; height: number }, iterations?: number): Pipeline",
  standalone: "grabCut(input, output, rect, iterations?)",
  desc: "GrabCut foreground extraction seeded by a rectangle. Pixels outside rect are treated as background; background pixels in the result are set to black.",
  params: [
    {
      name: "rect",
      type: "{ x, y, width, height }",
      req: true,
      def: null,
      desc: "Rectangle (in pixels) enclosing the foreground object.",
    },
    {
      name: "iterations",
      type: "number",
      req: false,
      def: "5",
      desc: "GrabCut refinement iterations.",
    },
  ],
  notes: null,
};
registerOp("grabCut", (rect: Rect, iterations = 5) => ({
  rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  iterations,
}));
