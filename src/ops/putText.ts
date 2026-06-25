import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

declare module "../core/pipeline" {
  interface OpArgsMap {
    putText: [
      text: string,
      x: number,
      y: number,
      fontScale?: number,
      color?: Color,
      thickness?: number,
      antialias?: boolean,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Draw a text label onto the current image (Hershey simplex font) — e.g. a
     * confidence score or class name. `(x, y)` is the bottom-left of the text.
     * The image flows on unchanged in size and type.
     *
     * @param text      Label to render (non-empty).
     * @param x         Bottom-left X of the text (px).
     * @param y         Bottom-left Y of the text (px).
     * @param fontScale Font size multiplier (> 0). Default `1`.
     * @param color     Text color as `[r, g, b]` (0–255). Default red.
     * @param thickness Stroke width in px (>= 1). Default `2`.
     * @param antialias Smooth edges with anti-aliasing. Default `true`; pass
     *                  `false` for hard, aliased edges.
     */
    putText(
      text: string,
      x: number,
      y: number,
      fontScale?: number,
      color?: Color,
      thickness?: number,
      antialias?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "putText",
  (
    text: string,
    x: number,
    y: number,
    fontScale: number = 1,
    color: Color = [255, 0, 0],
    thickness: number = 2,
    antialias: boolean = true,
  ) => ({ text, x, y, fontScale, color, thickness, antialias }),
);
