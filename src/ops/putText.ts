import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { Color } from "./drawRect";

/** Styling options for {@link Pipeline.putText}. */
export interface PutTextOptions {
  /** Font size multiplier (> 0). Default `1`. */
  fontScale?: number;
  /** Text color as `[r, g, b]` (0–255). Default red `[255, 0, 0]`. */
  color?: Color;
  /** Stroke width in px (>= 1). Default `2`. */
  thickness?: number;
  /** Smooth edges with anti-aliasing. Default `true`; `false` for hard edges. */
  antialias?: boolean;
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    putText: [text: string, x: number, y: number, options?: PutTextOptions];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Draw a text label onto the current image (Hershey simplex font) — e.g. a
     * confidence score or class name. `(x, y)` is the bottom-left of the text.
     * The image flows on unchanged in size and type.
     *
     * @param text    Label to render (non-empty).
     * @param x       Bottom-left X of the text (px).
     * @param y       Bottom-left Y of the text (px).
     * @param options Styling — `fontScale`, `color`, `thickness`, and
     *                `antialias`. See {@link PutTextOptions}.
     */
    putText(
      text: string,
      x: number,
      y: number,
      options?: PutTextOptions,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "putText",
  (text: string, x: number, y: number, options: PutTextOptions = {}) => {
    const {
      fontScale = 1,
      color = [255, 0, 0],
      thickness = 2,
      antialias = true,
    } = options;
    return { text, x, y, fontScale, color, thickness, antialias };
  },
);
