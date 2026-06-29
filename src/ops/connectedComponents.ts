import { registerDataOp } from "../core/pipeline";
import type { InputState, OutputState } from "../core/state";
import type { OpDoc } from "./docTypes";

/** Options for {@link Pipeline.connectedComponents}. */
export interface ConnectedComponentsOptions {
  /** Pixel connectivity: `4` or `8` (default). */
  connectivity?: 4 | 8;
  /** Discard components whose area is below this value (px²). Default `0`. */
  minArea?: number;
}

/** A single connected component (the background label is omitted). */
export interface ConnectedComponent {
  /** Component label (1-based; background label 0 is excluded). */
  label: number;
  /** Component area in px². */
  area: number;
  /** Axis-aligned bounds (`cv::connectedComponentsWithStats`). */
  boundingBox: { x: number; y: number; width: number; height: number };
  /** Centroid in pixels. */
  centroid: { x: number; y: number };
}

/** Structured result of a {@link Pipeline.connectedComponents} analysis. */
export interface ConnectedComponentsResult {
  /** `true` when at least one foreground component passed the filter. */
  found: boolean;
  /** Number of foreground components returned. */
  count: number;
  /** Components ordered largest-area first. */
  components: ConnectedComponent[];
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
     * Label connected foreground regions and return each one's area, bounding
     * box, and centroid (`cv::connectedComponentsWithStats`). Treats the image
     * as a binary mask, so chain `gray()` + `threshold()` first.
     */
    connectedComponents(
      this: Pipeline<"input-set", Output>,
      options?: ConnectedComponentsOptions,
    ): Promise<ConnectedComponentsResult>;
  }
}

export const connectedComponentsDoc: OpDoc = {
  name: "Connected Components",
  category: "segmentation",
  kind: "data",
  method:
    "connectedComponents(options?: { connectivity?: 4 | 8; minArea?: number }): Promise<ConnectedComponentsResult>",
  standalone: null,
  desc: "Label connected foreground regions and return each one's area, bounding box, and centroid. Treats the image as a binary mask; chain gray() + threshold() first.",
  params: [
    {
      name: "options.connectivity",
      type: "4 | 8",
      req: false,
      def: "8",
      desc: "Pixel connectivity (4- or 8-connected).",
    },
    {
      name: "options.minArea",
      type: "number",
      req: false,
      def: "0",
      desc: "Discard components with area below this (px²).",
    },
  ],
  returns: `{
  found: boolean,
  count: number,
  components: Array<{
    label: number,
    area: number,
    boundingBox: { x, y, width, height },
    centroid: { x, y }
  }>,
  width: number,
  height: number
}`,
  notes: "Components are ordered largest-area first.",
};
registerDataOp(
  "connectedComponents",
  (options: ConnectedComponentsOptions = {}) => {
    const { connectivity = 8, minArea = 0 } = options;
    return { connectivity, minArea };
  },
);
