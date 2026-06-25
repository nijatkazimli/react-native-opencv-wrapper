import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawLine: [
      x1: number,
      y1: number,
      x2: number,
      y2: number,
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
     * Draw a straight line segment onto the current image — e.g. to connect
     * two landmarks. The image flows on unchanged in size and type.
     *
     * @param x1        Start X (px).
     * @param y1        Start Y (px).
     * @param x2        End X (px).
     * @param y2        End Y (px).
     * @param color     Line color as `[r, g, b]` (0–255). Default red.
     * @param thickness Stroke width in px (>= 1). Default `2`.
     * @param antialias Smooth edges with anti-aliasing. Default `true`; pass
     *                  `false` for hard, aliased edges.
     */
    drawLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color?: Color,
      thickness?: number,
      antialias?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawLine",
  (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: Color = [255, 0, 0],
    thickness: number = 2,
    antialias: boolean = true,
  ) => ({ x1, y1, x2, y2, color, thickness, antialias }),
);
