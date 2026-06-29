import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

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

registerOp("grabCut", (rect: Rect, iterations = 5) => ({
  rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  iterations,
}));
