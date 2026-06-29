/**
 * Documentation metadata that is NOT per-operation and therefore has no home
 * in an op file: category definitions, error-code meanings, supported output
 * formats, and the OpenCV bundling blurb. Owned by the docs generator
 * (`gen-docs-data.mjs`). Per-op content lives in each `src/ops/<op>.ts` as its
 * exported `doc` constant; package name/version/repo come from package.json.
 *
 * Category order here defines the order categories render on the site. Within
 * a category, ops are ordered alphabetically by display name.
 */

export const opencvBlurb =
  "Bundled by default (Android 4.11.0, iOS ~4.3); version and host/bundled mode are configurable on both platforms";

export const imageFormats = ["png", "jpg", "jpeg", "webp", "bmp"];

export const errorCodes = [
  {
    code: "opencv_invalid_argument",
    meaning:
      "Missing or invalid parameter, out-of-range value, or unknown enum (e.g. an invalid thresholdType, a kernelSize that is not odd, or a bounds-check failure).",
  },
  {
    code: "opencv_io_error",
    meaning:
      "Could not read the input or write the output image — file not found, permission denied, unsupported format, disk full, and similar.",
  },
  {
    code: "opencv_unknown_op",
    meaning:
      "A pipeline referenced an op type with no registered handler (internal error or a corrupted pipeline).",
  },
  {
    code: "opencv_document_not_found",
    meaning:
      "scanDocument could not locate a document-like quadrilateral — low contrast, no visible border, or the document fills the frame.",
  },
  {
    code: "opencv_unavailable",
    meaning:
      "OpenCV is missing a required capability: the native library failed to initialize, or a host-provided OpenCV is too old for the op (e.g. decodeQR needs ≥ 4.3.0).",
  },
  {
    code: "opencv_error",
    meaning: "Unexpected or uncategorized native error.",
  },
];

export const categories = [
  {
    id: "color-channels",
    name: "Color & Channels",
    desc: "Convert between color spaces and channel layouts.",
  },
  {
    id: "thresholding",
    name: "Thresholding",
    desc: "Binarize images with fixed, adaptive, or range-based rules.",
  },
  {
    id: "blur-smoothing",
    name: "Blur & Smoothing",
    desc: "Reduce noise and detail with linear and edge-preserving filters.",
  },
  {
    id: "edges-gradients",
    name: "Edges & Gradients",
    desc: "Highlight intensity changes and directional derivatives.",
  },
  {
    id: "morphology",
    name: "Morphology",
    desc: "Grow, shrink, and clean up binary shapes.",
  },
  {
    id: "geometry-transforms",
    name: "Geometry & Transforms",
    desc: "Resize, crop, rotate, flip, pad, and warp.",
  },
  {
    id: "histogram-tone",
    name: "Histogram & Tone",
    desc: "Adjust brightness, contrast, and tonal distribution.",
  },
  {
    id: "masking-bitwise",
    name: "Masking & Bitwise",
    desc: "Build and apply masks; invert pixels.",
  },
  {
    id: "drawing",
    name: "Drawing",
    desc: "Annotate images with shapes, text, contours, and overlays.",
  },
  {
    id: "segmentation",
    name: "Segmentation",
    desc: "Partition the image into regions or objects.",
  },
  {
    id: "contours-shape",
    name: "Contours & Shape Analysis",
    desc: "Find contours and measure their geometry.",
  },
  {
    id: "feature-detection",
    name: "Feature Detection",
    desc: "Detect lines, circles, templates, and QR codes.",
  },
  {
    id: "analysis-measurement",
    name: "Analysis & Measurement",
    desc: "Compute pixel statistics and extrema.",
  },
  {
    id: "document",
    name: "Document",
    desc: "Detect and flatten documents.",
  },
  {
    id: "other",
    name: "Other",
    desc: "Custom convolution kernels and debugging taps.",
  },
];
