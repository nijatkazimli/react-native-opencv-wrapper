import { registerOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Distance metric for {@link Pipeline.distanceTransform}. */
export type DistanceType = "L1" | "L2" | "C";

/** Mask size for {@link Pipeline.distanceTransform}. */
export type DistanceMaskSize = 0 | 3 | 5;

declare module "../core/pipeline" {
  interface OpArgsMap {
    distanceTransform: [
      distanceType?: DistanceType,
      maskSize?: DistanceMaskSize,
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
      maskSize?: DistanceMaskSize,
      normalize?: boolean,
    ): Pipeline<Input, Output>;
  }
}

export const distanceTransformDoc: OpDoc = {
  name: "Distance Transform",
  category: "analysis-measurement",
  kind: "image",
  method:
    'distanceTransform(distanceType?: "L1" | "L2" | "C", maskSize?: 0 | 3 | 5, normalize?: boolean): Pipeline',
  standalone:
    "distanceTransform(input, output, distanceType?, maskSize?, normalize?)",
  desc: "Replace each foreground pixel with its distance to the nearest zero pixel. The image is grayscaled and Otsu-binarized first.",
  params: [
    {
      name: "distanceType",
      type: '"L1" | "L2" | "C"',
      req: false,
      def: '"L2"',
      desc: "Distance metric (Euclidean, Manhattan, Chebyshev).",
    },
    {
      name: "maskSize",
      type: "0 | 3 | 5",
      req: false,
      def: "3",
      desc: "Mask size; 0 = precise, 3 or 5 for faster approximation.",
    },
    {
      name: "normalize",
      type: "boolean",
      req: false,
      def: "true",
      desc: "Scale the result to 0–255 for display.",
    },
  ],
  notes: "Otsu-binarizes internally; raw distances when normalize is false.",
};
registerOp(
  "distanceTransform",
  (
    distanceType: DistanceType = "L2",
    maskSize: DistanceMaskSize = 3,
    normalize = true,
  ) => ({
    distanceType,
    maskSize,
    normalize,
  }),
);
