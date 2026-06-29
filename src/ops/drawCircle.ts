import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const drawCircleDoc: OpDoc = {
  name: "Draw Circle",
  category: "drawing",
  kind: "image",
  method:
    "drawCircle(centerX: number, centerY: number, radius: number, options?: { color?: [r, g, b]; thickness?: number; fillColor?: [r, g, b]; antialias?: boolean }): Pipeline",
  standalone: "drawCircle(input, output, centerX, centerY, radius, options?)",
  desc: "Draw a circle (optionally filled) on the current image. Mark keypoints or detection centers.",
  params: [
    {
      name: "centerX",
      type: "number",
      req: true,
      def: null,
      desc: "Center X (px).",
    },
    {
      name: "centerY",
      type: "number",
      req: true,
      def: null,
      desc: "Center Y (px).",
    },
    {
      name: "radius",
      type: "number",
      req: true,
      def: null,
      desc: "Radius (px, > 0).",
    },
    {
      name: "options.color",
      type: "[r, g, b]",
      req: false,
      def: "[255, 0, 0]",
      desc: "Stroke color (0–255 each).",
    },
    {
      name: "options.thickness",
      type: "number",
      req: false,
      def: "2",
      desc: "Stroke width (px, ≥ 1).",
    },
    {
      name: "options.fillColor",
      type: "[r, g, b]",
      req: false,
      def: "undefined",
      desc: "Optional solid fill, drawn under the stroke.",
    },
    {
      name: "options.antialias",
      type: "boolean",
      req: false,
      def: "true",
      desc: "Smooth edges.",
    },
  ],
  notes: null,
};
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
