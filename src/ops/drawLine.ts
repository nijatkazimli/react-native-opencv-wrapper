import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

/** Styling options for {@link Pipeline.drawLine}. */
export interface DrawLineOptions {
  /** Line color as `[r, g, b]` (0–255). Default red `[255, 0, 0]`. */
  color?: Color;
  /** Stroke width in px (>= 1). Default `2`. */
  thickness?: number;
  /** Smooth edges with anti-aliasing. Default `true`; `false` for hard edges. */
  antialias?: boolean;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawLine: [
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      options?: DrawLineOptions,
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
     * @param x1      Start X (px).
     * @param y1      Start Y (px).
     * @param x2      End X (px).
     * @param y2      End Y (px).
     * @param options Styling — `color`, `thickness`, and `antialias`. See
     *                {@link DrawLineOptions}.
     */
    drawLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      options?: DrawLineOptions,
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
    options: DrawLineOptions = {},
  ) => {
    const { color = [255, 0, 0], thickness = 2, antialias = true } = options;
    return { x1, y1, x2, y2, color, thickness, antialias };
  },
);
