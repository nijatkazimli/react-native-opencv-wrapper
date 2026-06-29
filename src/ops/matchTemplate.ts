import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Comparison method for {@link Pipeline.matchTemplate} (`cv::matchTemplate`). */
export type TemplateMatchMethod =
  | "sqdiff"
  | "sqdiffNormed"
  | "ccorr"
  | "ccorrNormed"
  | "ccoeff"
  | "ccoeffNormed";

/** Options for {@link Pipeline.matchTemplate}. */
export interface MatchTemplateOptions {
  /**
   * Template image to search for, as an absolute file path or a (data-URI or
   * raw) base64 string. Must be no larger than the current image.
   */
  template: string;
  /** Comparison method. Default `"ccoeffNormed"`. */
  method?: TemplateMatchMethod;
}

/** Structured result of a {@link Pipeline.matchTemplate} analysis. */
export interface MatchTemplateResult {
  found: boolean;
  /**
   * Match score at the best location. For normed methods this is in `[0, 1]`
   * (or `[-1, 1]` for `ccoeffNormed`); higher is better except for the
   * `sqdiff*` methods, where lower is better.
   */
  score: number;
  /** Top-left corner of the best match in the current image. */
  location: { x: number; y: number } | null;
  /** Width of the template. */
  templateWidth: number;
  /** Height of the template. */
  templateHeight: number;
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
     * Locate a smaller `template` image within the current image
     * (`cv::matchTemplate`) and return the best match location and score.
     */
    matchTemplate(
      this: Pipeline<"input-set", Output>,
      options: MatchTemplateOptions,
    ): Promise<MatchTemplateResult>;
  }
}

registerDataOp("matchTemplate", (options: MatchTemplateOptions) => {
  const { template, method = "ccoeffNormed" } = options;
  return { template, method };
});
