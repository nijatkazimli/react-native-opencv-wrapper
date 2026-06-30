import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.goodFeaturesToTrack}. */
export interface GoodFeaturesToTrackOptions {
  /** Maximum number of corners to return (strongest first). Default `100`. */
  maxCorners?: number;
  /**
   * Minimal accepted corner quality, as a fraction of the best corner's
   * measure (0–1). Default `0.01`.
   */
  qualityLevel?: number;
  /** Minimum Euclidean distance between returned corners (px). Default `10`. */
  minDistance?: number;
  /** Neighborhood size for the corner measure. Default `3`. */
  blockSize?: number;
  /** Use the Harris detector instead of Shi-Tomasi. Default `false`. */
  useHarrisDetector?: boolean;
  /** Harris free parameter (only used when `useHarrisDetector`). Default `0.04`. */
  k?: number;
}

/** A detected corner point in pixel coordinates. */
export interface CornerPoint {
  x: number;
  y: number;
}

/** Structured result of a {@link Pipeline.goodFeaturesToTrack} analysis. */
export interface GoodFeaturesToTrackResult {
  found: boolean;
  count: number;
  /** Corners ordered strongest-first. */
  corners: CornerPoint[];
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
     * Detect corner feature points (`cv::goodFeaturesToTrack`) and return them
     * as a point list, strongest first. Uses the Shi-Tomasi measure by
     * default, or the Harris detector when `useHarrisDetector` is set. Operates
     * on a grayscale view of the current image.
     */
    goodFeaturesToTrack(
      this: Pipeline<"input-set", Output>,
      options?: GoodFeaturesToTrackOptions,
    ): Promise<GoodFeaturesToTrackResult>;
  }
}

export const goodFeaturesToTrackDoc: OpDoc = {
  name: "Good Features To Track",
  category: "feature-detection",
  kind: "data",
  method:
    "goodFeaturesToTrack(options?: { maxCorners?: number; qualityLevel?: number; minDistance?: number; blockSize?: number; useHarrisDetector?: boolean; k?: number }): Promise<GoodFeaturesToTrackResult>",
  standalone: null,
  desc: "Detect corner feature points (Shi-Tomasi by default, or Harris when useHarrisDetector is set) and return them as a point list, strongest first. Operates on a grayscale view of the image.",
  params: [
    {
      name: "options.maxCorners",
      type: "number",
      req: false,
      def: "100",
      desc: "Maximum number of corners to return (strongest first).",
    },
    {
      name: "options.qualityLevel",
      type: "number",
      req: false,
      def: "0.01",
      desc: "Minimal corner quality as a fraction of the best corner's measure (0–1).",
    },
    {
      name: "options.minDistance",
      type: "number",
      req: false,
      def: "10",
      desc: "Minimum Euclidean distance between returned corners (px).",
    },
    {
      name: "options.blockSize",
      type: "number",
      req: false,
      def: "3",
      desc: "Neighborhood size for the corner measure.",
    },
    {
      name: "options.useHarrisDetector",
      type: "boolean",
      req: false,
      def: "false",
      desc: "Use the Harris detector instead of Shi-Tomasi.",
    },
    {
      name: "options.k",
      type: "number",
      req: false,
      def: "0.04",
      desc: "Harris free parameter (only used when useHarrisDetector).",
    },
  ],
  returns: `{
  found: boolean,
  count: number,
  corners: Array<{ x: number, y: number }>,
  width: number,
  height: number
}`,
  notes: "Grayscales internally.",
};
registerDataOp(
  "goodFeaturesToTrack",
  (options: GoodFeaturesToTrackOptions = {}) => {
    const {
      maxCorners = 100,
      qualityLevel = 0.01,
      minDistance = 10,
      blockSize = 3,
      useHarrisDetector = false,
      k = 0.04,
    } = options;
    return {
      maxCorners,
      qualityLevel,
      minDistance,
      blockSize,
      useHarrisDetector,
      k,
    };
  },
);
