import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/**
 * An RGB color, each channel in `0–255` (e.g. `[255, 0, 0]` is red). Drawing
 * ops render it onto the image; on a single-channel image only the first
 * component is used.
 */
export type Color = readonly [r: number, g: number, b: number];

/** Styling options for {@link Pipeline.drawRect}. */
export interface DrawRectOptions {
  /** Outline (stroke) color as `[r, g, b]` (0–255). Default red `[255, 0, 0]`. */
  color?: Color;
  /** Stroke width in px (>= 1). Default `2`. */
  thickness?: number;
  /**
   * Optional solid-fill color as `[r, g, b]` (0–255). When given, the interior
   * is flood-filled (fast scanline fill) with this color before the outline is
   * stroked on top; omit to leave the rectangle unfilled.
   */
  fillColor?: Color;
  /** Smooth edges with anti-aliasing. Default `true`; `false` for hard edges. */
  antialias?: boolean;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawRect: [
      x: number,
      y: number,
      width: number,
      height: number,
      options?: DrawRectOptions,
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
     * @param x       Left edge (px).
     * @param y       Top edge (px).
     * @param width   Rectangle width (px, > 0).
     * @param height  Rectangle height (px, > 0).
     * @param options Styling — stroke `color`, `thickness`, optional `fillColor`,
     *                and `antialias`. See {@link DrawRectOptions}.
     */
    drawRect(
      x: number,
      y: number,
      width: number,
      height: number,
      options?: DrawRectOptions,
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
    options: DrawRectOptions = {},
  ) => {
    const {
      color = [255, 0, 0],
      thickness = 2,
      fillColor,
      antialias = true,
    } = options;
    return { x, y, width, height, color, thickness, fillColor, antialias };
  },
);
