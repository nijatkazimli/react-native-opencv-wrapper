import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

/** A 2D point as `[x, y]` in pixel coordinates. */
export type Point2D = readonly [x: number, y: number];

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawPolygon: [
      points: readonly Point2D[],
      color?: Color,
      thickness?: number,
      closed?: boolean,
      fillColor?: Color,
      antialias?: boolean,
    ];
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
     * @param points    Vertices as `[x, y]` pairs (at least 2).
     * @param color     Outline (stroke) color as `[r, g, b]` (0–255). Default
     *                  red.
     * @param thickness Stroke width in px (>= 1). Default `2`.
     * @param closed    Whether to connect the last point back to the first.
     *                  Default `true`.
     * @param fillColor Optional solid-fill color as `[r, g, b]` (0–255). When
     *                  given, the polygon is flood-filled (fast scanline fill)
     *                  with this color before the edges are stroked on top;
     *                  omit to leave the polygon unfilled.
     * @param antialias Smooth edges with anti-aliasing. Default `true`; pass
     *                  `false` for hard, aliased edges.
     */
    drawPolygon(
      points: readonly Point2D[],
      color?: Color,
      thickness?: number,
      closed?: boolean,
      fillColor?: Color,
      antialias?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawPolygon",
  (
    points: readonly Point2D[],
    color: Color = [255, 0, 0],
    thickness: number = 2,
    closed: boolean = true,
    fillColor?: Color,
    antialias: boolean = true,
  ) => ({ points, color, thickness, closed, fillColor, antialias }),
);
