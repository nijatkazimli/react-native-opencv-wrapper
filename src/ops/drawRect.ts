import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const drawRectDoc: OpDoc = {
  name: "Draw Rectangle",
  category: "drawing",
  kind: "image",
  method:
    "drawRect(x: number, y: number, width: number, height: number, options?: { color?: [r, g, b]; thickness?: number; fillColor?: [r, g, b]; antialias?: boolean }): Pipeline",
  standalone: "drawRect(input, output, x, y, width, height, options?)",
  desc: "Draw a rectangle outline (optionally filled) on the current image. Box a detected region; the image is passed on unchanged in size and type.",
  params: [
    {
      name: "x",
      type: "number",
      req: true,
      def: null,
      desc: "Left edge (px).",
    },
    { name: "y", type: "number", req: true, def: null, desc: "Top edge (px)." },
    {
      name: "width",
      type: "number",
      req: true,
      def: null,
      desc: "Width (px, > 0).",
    },
    {
      name: "height",
      type: "number",
      req: true,
      def: null,
      desc: "Height (px, > 0).",
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
