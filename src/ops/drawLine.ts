import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";
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

export const drawLineDoc: OpDoc = {
  name: "Draw Line",
  category: "drawing",
  kind: "image",
  method:
    "drawLine(x1: number, y1: number, x2: number, y2: number, options?: { color?: [r, g, b]; thickness?: number; antialias?: boolean }): Pipeline",
  standalone: "drawLine(input, output, x1, y1, x2, y2, options?)",
  desc: "Draw a line segment on the current image. Connect landmarks; image is passed on unchanged.",
  params: [
    { name: "x1", type: "number", req: true, def: null, desc: "Start X (px)." },
    { name: "y1", type: "number", req: true, def: null, desc: "Start Y (px)." },
    { name: "x2", type: "number", req: true, def: null, desc: "End X (px)." },
    { name: "y2", type: "number", req: true, def: null, desc: "End Y (px)." },
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
