import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

declare module "../core/pipeline" {
  interface OpArgsMap {
    blend: [source: string, alpha?: number, beta?: number, gamma?: number];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a weighted blend of the current image with a second image
     * (`cv::addWeighted`): `out = alpha * current + beta * source + gamma`.
     * Useful for watermarks, overlays, and before/after composites.
     *
     * @param source Second image as an absolute file path or a (data-URI or
     *               raw) base64 string. It is decoded natively and resized to
     *               match the current image before blending.
     * @param alpha  Weight of the current image. Default `0.5`.
     * @param beta   Weight of `source`. Default `0.5`.
     * @param gamma  Scalar added to the sum. Default `0`.
     */
    blend(
      source: string,
      alpha?: number,
      beta?: number,
      gamma?: number,
    ): Pipeline<Input, Output>;
  }
}

registerOp("blend", (source: string, alpha = 0.5, beta = 0.5, gamma = 0) => ({
  source,
  alpha,
  beta,
  gamma,
}));
