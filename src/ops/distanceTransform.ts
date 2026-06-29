import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";

/** Distance metric for {@link Pipeline.distanceTransform}. */
export type DistanceType = "L1" | "L2" | "C";

declare module "../core/pipeline" {
  interface OpArgsMap {
    distanceTransform: [
      distanceType?: DistanceType,
      maskSize?: 0 | 3 | 5,
      normalize?: boolean,
    ];
  }

  interface Pipeline<
    Input extends InputState = "missing-input",
    Output extends OutputState = "missing-output",
  > {
    /**
     * Queue a distance transform (`cv::distanceTransform`): each foreground
     * pixel is replaced by its distance to the nearest zero pixel. The image is
     * converted to grayscale and binarized (Otsu) first.
     *
     * @param distanceType Distance metric. Default `"L2"` (Euclidean).
     * @param maskSize      `0` (precise), `3`, or `5`. Default `3`.
     * @param normalize     Scale the result to `0–255` for display. Default
     *                      `true`.
     */
    distanceTransform(
      distanceType?: DistanceType,
      maskSize?: 0 | 3 | 5,
      normalize?: boolean,
    ): Pipeline<Input, Output>;
  }
}

registerOp(
  "distanceTransform",
  (
    distanceType: DistanceType = "L2",
    maskSize: 0 | 3 | 5 = 3,
    normalize = true,
  ) => ({
    distanceType,
    maskSize,
    normalize,
  }),
);
