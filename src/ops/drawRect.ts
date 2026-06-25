import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/**
 * An RGB color, each channel in `0–255` (e.g. `[255, 0, 0]` is red). Drawing
 * ops render it onto the image; on a single-channel image only the first
 * component is used.
 */
export type Color = readonly [r: number, g: number, b: number];

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawRect: [
      x: number,
      y: number,
      width: number,
      height: number,
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
     * Draw a rectangle outline onto the current image — e.g. to box a detected
     * region. The image flows on unchanged in size, depth, and channel count.
     *
     * @param x         Left edge (px).
     * @param y         Top edge (px).
     * @param width     Rectangle width (px, > 0).
     * @param height    Rectangle height (px, > 0).
     * @param color     Outline (stroke) color as `[r, g, b]` (0–255). Default
     *                  red.
     * @param thickness Stroke width in px (>= 1). Default `2`.
     * @param fillColor Optional solid-fill color as `[r, g, b]` (0–255). When
     *                  given, the interior is flood-filled (fast scanline fill)
     *                  with this color before the outline is stroked on top;
     *                  omit to leave the rectangle unfilled.
     * @param antialias Smooth edges with anti-aliasing. Default `true`; pass
     *                  `false` for hard, aliased edges.
     */
    drawRect(
      x: number,
      y: number,
      width: number,
      height: number,
      color?: Color,
      thickness?: number,
      fillColor?: Color,
      antialias?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawRect",
  (
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color = [255, 0, 0],
    thickness: number = 2,
    fillColor?: Color,
    antialias: boolean = true,
  ) => ({ x, y, width, height, color, thickness, fillColor, antialias }),
);
