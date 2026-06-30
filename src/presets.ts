import { pipeline, type Pipeline, type PipelineRecipe } from "./core/pipeline";

/**
 * Build a portable {@link PipelineRecipe} by running `build` against an empty
 * pipeline and capturing its ops. Using the typed op builders (instead of
 * hand-written JSON) keeps each preset in sync with its ops' parameter schemas.
 */
function recipe(build: (p: Pipeline) => Pipeline): PipelineRecipe {
  return build(pipeline()).toJSON();
}

/**
 * Ready-made {@link PipelineRecipe} presets: reusable, source-agnostic op
 * recipes. Drop one into any chain with {@link Pipeline.apply}, or load it
 * standalone with {@link Pipeline.fromJSON}.
 *
 * @example
 * await pipeline()
 *   .input(src)
 *   .outputBase64("png")
 *   .apply(presets.edges)
 *   .run();
 */
export const presets = {
  /** Grayscale edge map: denoise with a Gaussian blur, then run Canny. */
  edges: recipe((p) => p.gray().gaussianBlur(5).canny(50, 150)),

  /** High-contrast black & white document scan via adaptive thresholding. */
  crispScan: recipe((p) => p.gray().adaptiveThreshold(255, 15, 5)),

  /** Gentle portrait cleanup: edge-preserving smoothing + local contrast. */
  softenPortrait: recipe((p) => p.bilateralFilter(9, 75, 75).clahe(2, 8)),
} as const;

/** Name of a built-in preset in {@link presets}. */
export type PresetName = keyof typeof presets;
