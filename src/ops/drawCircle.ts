import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { DrawRectOptions } from "./drawRect";

/** Styling options for {@link Pipeline.drawCircle}. */
export type DrawCircleOptions = DrawRectOptions;

declare module "../core/pipeline" {
  interface OpArgsMap {
    drawCircle: [
      centerX: number,
      centerY: number,
      radius: number,
      options?: DrawCircleOptions,
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
     * @param centerX Center X (px).
     * @param centerY Center Y (px).
     * @param radius  Circle radius (px, > 0).
     * @param options Styling — stroke `color`, `thickness`, optional `fillColor`,
     *                and `antialias`. See {@link DrawCircleOptions}.
     */
    drawCircle(
      centerX: number,
      centerY: number,
      radius: number,
      options?: DrawCircleOptions,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "drawCircle",
  (
    centerX: number,
    centerY: number,
    radius: number,
    options: DrawCircleOptions = {},
  ) => {
    const {
      color = [255, 0, 0],
      thickness = 2,
      fillColor,
      antialias = true,
    } = options;
    return { centerX, centerY, radius, color, thickness, fillColor, antialias };
  },
);
