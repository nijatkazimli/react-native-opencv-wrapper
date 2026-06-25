import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

/** A 2D point as `[x, y]` in pixel coordinates. */
export type Point2D = readonly [x: number, y: number];

/** Styling options for {@link Pipeline.drawPolygon}. */
export interface DrawPolygonOptions {
  /** Outline (stroke) color as `[r, g, b]` (0–255). Default red `[255, 0, 0]`. */
  color?: Color;
  /** Stroke width in px (>= 1). Default `2`. */
  thickness?: number;
  /** Connect the last point back to the first. Default `true`. */
  closed?: boolean;
  /**
   * Optional solid-fill color as `[r, g, b]` (0–255). When given, the polygon
   * is flood-filled (fast scanline fill) with this color before the edges are
   * stroked on top; omit to leave the polygon unfilled.
   */
  fillColor?: Color;
  /** Smooth edges with anti-aliasing. Default `true`; `false` for hard edges. */
  antialias?: boolean;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawPolygon: [points: readonly Point2D[], options?: DrawPolygonOptions];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Draw a polyline/polygon through `points` onto the current image — e.g. to
     * outline the four corners returned by `detectDocument`. The image flows on
     * unchanged in size and type.
     *
     * @param points  Vertices as `[x, y]` pairs (at least 2).
     * @param options Styling — stroke `color`, `thickness`, `closed`, optional
     *                `fillColor`, and `antialias`. See {@link DrawPolygonOptions}.
     */
    drawPolygon(
      points: readonly Point2D[],
      options?: DrawPolygonOptions,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawPolygon",
  (points: readonly Point2D[], options: DrawPolygonOptions = {}) => {
    const {
      color = [255, 0, 0],
      thickness = 2,
      closed = true,
      fillColor,
      antialias = true,
    } = options;
    return { points, color, thickness, closed, fillColor, antialias };
  },
);
