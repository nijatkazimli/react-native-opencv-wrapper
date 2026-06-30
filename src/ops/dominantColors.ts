import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.dominantColors}. */
export interface DominantColorsOptions {
  /** Number of dominant colors to extract (>= 1). Default `5`. */
  k?: number;
  /** k-means re-run count; the best result is kept. Default `3`. */
  attempts?: number;
  /** Maximum k-means iterations per attempt. Default `10`. */
  iterations?: number;
}

/** A single dominant color and how much of the image it covers. */
export interface DominantColor {
  /** Color channels, each 0–255. */
  color: { r: number; g: number; b: number };
  /** `#RRGGBB` hex string for the color. */
  hex: string;
  /** Number of pixels assigned to this color's cluster. */
  population: number;
  /** Share of the image covered by this color (0–1). */
  fraction: number;
}

/** Structured result of a {@link Pipeline.dominantColors} analysis. */
export interface DominantColorsResult {
  /** Dominant colors, most-dominant first. */
  colors: DominantColor[];
  /** Number of colors returned. */
  count: number;
  width: number;
  height: number;
}

declare module "../core/pipeline" {
  interface Pipeline<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Extract the `k` dominant colors with k-means and return each as RGB +
     * hex with its pixel population and image fraction, ordered most-dominant
     * first. Unlike {@link Pipeline.kmeans} (which posterizes the image), this
     * is a terminal analysis step that returns the palette as data.
     */
    dominantColors(
      this: Pipeline<"input-set", Output>,
      options?: DominantColorsOptions,
    ): Promise<DominantColorsResult>;
  }
}

export const dominantColorsDoc: OpDoc = {
  name: "Dominant Colors",
  category: "analysis-measurement",
  kind: "data",
  method:
    "dominantColors(options?: { k?: number; attempts?: number; iterations?: number }): Promise<DominantColorsResult>",
  standalone: null,
  desc: "Extract the k dominant colors with k-means; returns each color as RGB + hex with its pixel population and image fraction, ordered most-dominant first. Unlike kmeans() (which posterizes the image), this returns the palette as data.",
  params: [
    {
      name: "options.k",
      type: "number",
      req: false,
      def: "5",
      desc: "Number of dominant colors to extract (≥ 1).",
    },
    {
      name: "options.attempts",
      type: "number",
      req: false,
      def: "3",
      desc: "k-means re-run count; the best result is kept.",
    },
    {
      name: "options.iterations",
      type: "number",
      req: false,
      def: "10",
      desc: "Maximum k-means iterations per attempt.",
    },
  ],
  returns: `{
  colors: Array<{ color: { r, g, b }, hex: string, population: number, fraction: number }>,
  count: number,
  width: number,
  height: number
}`,
  notes: "Uses k-means internally, so results can vary slightly between runs.",
};
registerDataOp("dominantColors", (options: DominantColorsOptions = {}) => {
  const { k = 5, attempts = 3, iterations = 10 } = options;
  return { k, attempts, iterations };
});
