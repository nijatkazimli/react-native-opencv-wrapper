import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawCircle: [
      centerX: number,
      centerY: number,
      radius: number,
      color?: Color,
      thickness?: number,
      fillColor?: Color,
      antialias?: boolean,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Draw a circle outline onto the current image — e.g. to mark a keypoint
     * or detection center. The image flows on unchanged in size and type.
     *
     * @param centerX   Center X (px).
     * @param centerY   Center Y (px).
     * @param radius    Circle radius (px, > 0).
     * @param color     Outline (stroke) color as `[r, g, b]` (0–255). Default
     *                  red.
     * @param thickness Stroke width in px (>= 1). Default `2`.
     * @param fillColor Optional solid-fill color as `[r, g, b]` (0–255). When
     *                  given, the disc is flood-filled (fast scanline fill)
     *                  with this color before the outline is stroked on top;
     *                  omit to leave the circle unfilled.
     * @param antialias Smooth edges with anti-aliasing. Default `true`; pass
     *                  `false` for hard, aliased edges.
     */
    drawCircle(
      centerX: number,
      centerY: number,
      radius: number,
      color?: Color,
      thickness?: number,
      fillColor?: Color,
      antialias?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawCircle",
  (
    centerX: number,
    centerY: number,
    radius: number,
    color: Color = [255, 0, 0],
    thickness: number = 2,
    fillColor?: Color,
    antialias: boolean = true,
  ) => ({ centerX, centerY, radius, color, thickness, fillColor, antialias }),
);
