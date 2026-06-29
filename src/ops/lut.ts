import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/**
 * A per-pixel intensity remap for `lut`. Either a function `y = f(x)` evaluated
 * over every 8-bit input value `x` (0–255), or a precomputed table of exactly
 * 256 output values. Output values are rounded and clamped to the 0–255 range.
 */
export type LutMap = ((x: number) => number) | readonly number[];

/** Build the 256-entry 8-bit table forwarded to the native `cv::LUT`. */
function buildLutTable(map: LutMap): number[] {
  const source =
    typeof map === "function"
      ? Array.from({ length: 256 }, (_unused, x) => map(x))
      : map;
  if (source.length !== 256) {
    throw new Error("lut table must have exactly 256 entries");
  }
  return source.map((value) => Math.max(0, Math.min(255, Math.round(value))));
}

declare module "../core/pipeline" {
  interface OpArgsMap {
    lut: [map: LutMap];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a per-pixel intensity remap (`cv::LUT`) — the point-transform
     * escape hatch for effects the named ops do not cover (invert, gamma,
     * posterize, solarize, custom contrast curves). The same table is applied
     * to every channel.
     *
     * Pass either a function `y = f(x)` (evaluated for each input value
     * `x = 0..255`) or a precomputed array of exactly 256 output values.
     * Outputs are rounded and clamped to 0–255. Examples:
     *
     * - invert: `lut((x) => 255 - x)`
     * - gamma:  `lut((x) => 255 * (x / 255) ** 0.5)`
     *
     * @param map Mapping function `(x) => y` or a 256-entry output table.
     */
    lut(map: LutMap): Pipeline<Input, Output>;
  }
}

export const lutDoc: OpDoc = {
  name: "Lookup Table (Per-Pixel Remap)",
  category: "histogram-tone",
  kind: "image",
  method: "lut(map: ((x: number) => number) | readonly number[]): Pipeline",
  standalone: "lut(input, output, map)",
  desc: "Per-pixel intensity remap — the point-transform escape hatch for invert, gamma, posterize, solarize, and custom curves. The same table is applied to all channels.",
  params: [
    {
      name: "map",
      type: "((x: number) => number) | readonly number[]",
      req: true,
      def: null,
      desc: "A function y = f(x) for x = 0..255, or a precomputed 256-entry table.",
    },
  ],
  notes:
    "Output values are rounded and clamped to 0–255; an array map must have exactly 256 entries. Adjacent lut/bitwiseNot ops are fused into one native pass automatically.",
};
registerOp("lut", (map: LutMap) => ({ table: buildLutTable(map) }));
