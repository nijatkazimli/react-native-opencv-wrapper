import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

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

export const blendDoc: OpDoc = {
  name: "Blend / Weighted Sum",
  category: "drawing",
  kind: "image",
  method:
    "blend(source: string, alpha?: number, beta?: number, gamma?: number): Pipeline",
  standalone: "blend(input, output, source, alpha?, beta?, gamma?)",
  desc: "Weighted blend: out = alpha · current + beta · source + gamma. Useful for watermarks, overlays, and before/after composites.",
  params: [
    {
      name: "source",
      type: "string",
      req: true,
      def: null,
      desc: "Second image as an absolute file path or base64 string; decoded and resized to match the current image.",
    },
    {
      name: "alpha",
      type: "number",
      req: false,
      def: "0.5",
      desc: "Weight of the current image.",
    },
    {
      name: "beta",
      type: "number",
      req: false,
      def: "0.5",
      desc: "Weight of the source image.",
    },
    {
      name: "gamma",
      type: "number",
      req: false,
      def: "0",
      desc: "Scalar added to the sum.",
    },
  ],
  notes:
    "The source image is automatically resized to match the current dimensions.",
};
registerOp("blend", (source: string, alpha = 0.5, beta = 0.5, gamma = 0) => ({
  source,
  alpha,
  beta,
  gamma,
}));
