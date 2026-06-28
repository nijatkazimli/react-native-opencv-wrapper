import NativeOpenCV from "./NativeReactNativeOpencvWrapper";
import {
  runStandaloneOp,
  standalone as registeredStandaloneOps,
  type StandaloneOps,
} from "./core/pipeline";
import type { FlipDirection } from "./ops/flip";
import type { Interpolation } from "./ops/resize";
import type { RotateAngle } from "./ops/rotate";
import type { ScanDocumentOptions } from "./ops/scanDocument";
import type { ThresholdType } from "./ops/threshold";
import type { ColorConversion } from "./ops/cvtColor";
import type { Kernel } from "./ops/filter2D";
import type {
  AdaptiveMethod,
  AdaptiveThresholdType,
} from "./ops/adaptiveThreshold";
import type { MorphOperation } from "./ops/morphologyEx";
import type { DrawRectOptions } from "./ops/drawRect";
import type { DrawCircleOptions } from "./ops/drawCircle";
import type { DrawLineOptions } from "./ops/drawLine";
import type { PutTextOptions } from "./ops/putText";
import type { Point2D, DrawPolygonOptions } from "./ops/drawPolygon";
import type { Quad } from "./ops/warpPerspective";
import type { Triangle } from "./ops/warpAffine";
import type { CopyMakeBorderOptions } from "./ops/copyMakeBorder";
import type { NormType } from "./ops/normalize";
import type { LutMap } from "./ops/lut";
import type { Kernel1D } from "./ops/sepFilter2D";
import "./ops";

/** Returns the linked OpenCV runtime version, e.g. `"4.10.0"`. */
export function getOpenCVVersion(): string {
  return NativeOpenCV.getOpenCVVersion();
}

/**
 * Convert an image at `inputPath` to grayscale and write it to `outputPath`.
 * Both paths must be absolute filesystem paths (no `file://` scheme).
 *
 * Supported formats follow `cv::imread` / `cv::imwrite` (jpg, png, bmp, ...).
 */
export function toGray(inputPath: string, outputPath: string): Promise<string> {
  return NativeOpenCV.toGray(inputPath, outputPath);
}

/**
 * Apply a Gaussian blur to an image.
 *
 * @param kernelSize Positive odd integer (e.g. 3, 5, 7). Same value used for
 *                   width and height.
 * @param sigmaX     Standard deviation in the X direction. Pass `0` to let
 *                   OpenCV derive it from `kernelSize`.
 */
export function gaussianBlur(
  inputPath: string,
  outputPath: string,
  kernelSize: number,
  sigmaX: number = 0,
): Promise<string> {
  return NativeOpenCV.gaussianBlur(inputPath, outputPath, kernelSize, sigmaX);
}

/**
 * Run the Canny edge detector. The output is a single-channel binary edge map.
 */
export function canny(
  inputPath: string,
  outputPath: string,
  threshold1: number,
  threshold2: number,
): Promise<string> {
  return NativeOpenCV.canny(inputPath, outputPath, threshold1, threshold2);
}

/**
 * Auto-typed standalone functions for every registered op.
 *
 * Example: `standaloneOps.rotate(input, output, 90)`.
 */
export const standaloneOps: StandaloneOps = registeredStandaloneOps;

/** Single-op execution helper with op-name generic inference. */
export { runStandaloneOp };

/** Standalone wrapper for `gray`. */
export function gray(inputPath: string, outputPath: string): Promise<string> {
  return runStandaloneOp("gray", inputPath, outputPath);
}

/** Standalone wrapper for `resize`. */
export function resize(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number,
  interpolation: Interpolation = "linear",
): Promise<string> {
  return runStandaloneOp(
    "resize",
    inputPath,
    outputPath,
    width,
    height,
    interpolation,
  );
}

/** Standalone wrapper for `crop`. */
export function crop(
  inputPath: string,
  outputPath: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<string> {
  return runStandaloneOp("crop", inputPath, outputPath, x, y, width, height);
}

/** Standalone wrapper for `rotate`. */
export function rotate(
  inputPath: string,
  outputPath: string,
  angle: RotateAngle,
): Promise<string> {
  return runStandaloneOp("rotate", inputPath, outputPath, angle);
}

/** Standalone wrapper for `flip`. */
export function flip(
  inputPath: string,
  outputPath: string,
  direction: FlipDirection,
): Promise<string> {
  return runStandaloneOp("flip", inputPath, outputPath, direction);
}

/** Standalone wrapper for `threshold`. */
export function threshold(
  inputPath: string,
  outputPath: string,
  thresh: number,
  maxValue: number,
  thresholdType: ThresholdType = "binary",
): Promise<string> {
  return runStandaloneOp(
    "threshold",
    inputPath,
    outputPath,
    thresh,
    maxValue,
    thresholdType,
  );
}

/** Standalone wrapper for `medianBlur`. */
export function medianBlur(
  inputPath: string,
  outputPath: string,
  kernelSize: number,
): Promise<string> {
  return runStandaloneOp("medianBlur", inputPath, outputPath, kernelSize);
}

/** Standalone wrapper for `dilate`. */
export function dilate(
  inputPath: string,
  outputPath: string,
  kernelSize: number,
  iterations: number = 1,
): Promise<string> {
  return runStandaloneOp(
    "dilate",
    inputPath,
    outputPath,
    kernelSize,
    iterations,
  );
}

/** Standalone wrapper for `erode`. */
export function erode(
  inputPath: string,
  outputPath: string,
  kernelSize: number,
  iterations: number = 1,
): Promise<string> {
  return runStandaloneOp(
    "erode",
    inputPath,
    outputPath,
    kernelSize,
    iterations,
  );
}

/**
 * Standalone wrapper for `scanDocument`: detect the largest document-like
 * quadrilateral and write a deskewed, perspective-corrected crop to
 * `outputPath`.
 *
 * Rejects with code `opencv_document_not_found` when no suitable
 * quadrilateral is detected.
 */
export function scanDocument(
  inputPath: string,
  outputPath: string,
  options?: ScanDocumentOptions,
): Promise<string> {
  return runStandaloneOp("scanDocument", inputPath, outputPath, options);
}

/** Standalone wrapper for `cvtColor`. */
export function cvtColor(
  inputPath: string,
  outputPath: string,
  code: ColorConversion,
): Promise<string> {
  return runStandaloneOp("cvtColor", inputPath, outputPath, code);
}

/** Standalone wrapper for `inRange`: write a single-channel binary mask. */
export function inRange(
  inputPath: string,
  outputPath: string,
  lower: readonly number[],
  upper: readonly number[],
): Promise<string> {
  return runStandaloneOp("inRange", inputPath, outputPath, lower, upper);
}

/** Standalone wrapper for `filter2D`: convolve with a custom kernel. */
export function filter2D(
  inputPath: string,
  outputPath: string,
  kernel: Kernel,
): Promise<string> {
  return runStandaloneOp("filter2D", inputPath, outputPath, kernel);
}

/**
 * Standalone wrapper for `adaptiveThreshold`: binarize using a per-region
 * threshold that tracks uneven lighting. The image is grayscaled first.
 */
export function adaptiveThreshold(
  inputPath: string,
  outputPath: string,
  maxValue: number,
  blockSize: number,
  c: number,
  method: AdaptiveMethod = "gaussian",
  thresholdType: AdaptiveThresholdType = "binary",
): Promise<string> {
  return runStandaloneOp(
    "adaptiveThreshold",
    inputPath,
    outputPath,
    maxValue,
    blockSize,
    c,
    method,
    thresholdType,
  );
}

/** Standalone wrapper for `morphologyEx`: compound morphology with a square kernel. */
export function morphologyEx(
  inputPath: string,
  outputPath: string,
  operation: MorphOperation,
  kernelSize: number,
  iterations: number = 1,
): Promise<string> {
  return runStandaloneOp(
    "morphologyEx",
    inputPath,
    outputPath,
    operation,
    kernelSize,
    iterations,
  );
}

/** Standalone wrapper for `bitwiseNot`: invert every pixel (`0 ↔ 255` on a mask). */
export function bitwiseNot(
  inputPath: string,
  outputPath: string,
): Promise<string> {
  return runStandaloneOp("bitwiseNot", inputPath, outputPath);
}

/** Standalone wrapper for `drawRect`: draw a rectangle onto an image. */
export function drawRect(
  inputPath: string,
  outputPath: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: DrawRectOptions,
): Promise<string> {
  return runStandaloneOp(
    "drawRect",
    inputPath,
    outputPath,
    x,
    y,
    width,
    height,
    options,
  );
}

/** Standalone wrapper for `drawCircle`: draw a circle onto an image. */
export function drawCircle(
  inputPath: string,
  outputPath: string,
  centerX: number,
  centerY: number,
  radius: number,
  options?: DrawCircleOptions,
): Promise<string> {
  return runStandaloneOp(
    "drawCircle",
    inputPath,
    outputPath,
    centerX,
    centerY,
    radius,
    options,
  );
}

/** Standalone wrapper for `drawLine`: draw a line segment onto an image. */
export function drawLine(
  inputPath: string,
  outputPath: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: DrawLineOptions,
): Promise<string> {
  return runStandaloneOp(
    "drawLine",
    inputPath,
    outputPath,
    x1,
    y1,
    x2,
    y2,
    options,
  );
}

/** Standalone wrapper for `putText`: draw a text label onto an image. */
export function putText(
  inputPath: string,
  outputPath: string,
  text: string,
  x: number,
  y: number,
  options?: PutTextOptions,
): Promise<string> {
  return runStandaloneOp("putText", inputPath, outputPath, text, x, y, options);
}

/** Standalone wrapper for `drawPolygon`: draw a polyline/polygon onto an image. */
export function drawPolygon(
  inputPath: string,
  outputPath: string,
  points: readonly Point2D[],
  options?: DrawPolygonOptions,
): Promise<string> {
  return runStandaloneOp("drawPolygon", inputPath, outputPath, points, options);
}

/**
 * Standalone wrapper for `warpPerspective`: map four `srcPoints` onto four
 * `dstPoints` (e.g. deskew a document). `width`/`height` default to the input
 * size.
 */
export function warpPerspective(
  inputPath: string,
  outputPath: string,
  srcPoints: Quad,
  dstPoints: Quad,
  width?: number,
  height?: number,
): Promise<string> {
  return runStandaloneOp(
    "warpPerspective",
    inputPath,
    outputPath,
    srcPoints,
    dstPoints,
    width,
    height,
  );
}

/**
 * Standalone wrapper for `warpAffine`: map three `srcPoints` onto three
 * `dstPoints`. `width`/`height` default to the input size.
 */
export function warpAffine(
  inputPath: string,
  outputPath: string,
  srcPoints: Triangle,
  dstPoints: Triangle,
  width?: number,
  height?: number,
): Promise<string> {
  return runStandaloneOp(
    "warpAffine",
    inputPath,
    outputPath,
    srcPoints,
    dstPoints,
    width,
    height,
  );
}

/**
 * Standalone wrapper for `blend`: `out = alpha * input + beta * source + gamma`.
 * `source` is a file path or base64 string, decoded and resized to match.
 */
export function blend(
  inputPath: string,
  outputPath: string,
  source: string,
  alpha?: number,
  beta?: number,
  gamma?: number,
): Promise<string> {
  return runStandaloneOp(
    "blend",
    inputPath,
    outputPath,
    source,
    alpha,
    beta,
    gamma,
  );
}

/**
 * Standalone wrapper for `equalizeHist`: global histogram equalization. The
 * image is grayscaled first, so the result is single-channel.
 */
export function equalizeHist(
  inputPath: string,
  outputPath: string,
): Promise<string> {
  return runStandaloneOp("equalizeHist", inputPath, outputPath);
}

/**
 * Standalone wrapper for `clahe`: contrast-limited adaptive histogram
 * equalization. The image is grayscaled first, so the result is single-channel.
 */
export function clahe(
  inputPath: string,
  outputPath: string,
  clipLimit?: number,
  tileGridSize?: number,
): Promise<string> {
  return runStandaloneOp(
    "clahe",
    inputPath,
    outputPath,
    clipLimit,
    tileGridSize,
  );
}

/** Standalone wrapper for `bilateralFilter`: edge-preserving smoothing. */
export function bilateralFilter(
  inputPath: string,
  outputPath: string,
  diameter?: number,
  sigmaColor?: number,
  sigmaSpace?: number,
): Promise<string> {
  return runStandaloneOp(
    "bilateralFilter",
    inputPath,
    outputPath,
    diameter,
    sigmaColor,
    sigmaSpace,
  );
}

/** Standalone wrapper for `copyMakeBorder`: pad an image by the given margins. */
export function copyMakeBorder(
  inputPath: string,
  outputPath: string,
  top: number,
  bottom: number,
  left: number,
  right: number,
  options?: CopyMakeBorderOptions,
): Promise<string> {
  return runStandaloneOp(
    "copyMakeBorder",
    inputPath,
    outputPath,
    top,
    bottom,
    left,
    right,
    options,
  );
}

/** Standalone wrapper for `normalize`: rescale pixel intensities. */
export function normalize(
  inputPath: string,
  outputPath: string,
  alpha?: number,
  beta?: number,
  normType?: NormType,
): Promise<string> {
  return runStandaloneOp(
    "normalize",
    inputPath,
    outputPath,
    alpha,
    beta,
    normType,
  );
}

/**
 * Standalone wrapper for `convertScaleAbs`: brightness/contrast as
 * `|alpha * input + beta|`, saturated to 8-bit.
 */
export function convertScaleAbs(
  inputPath: string,
  outputPath: string,
  alpha?: number,
  beta?: number,
): Promise<string> {
  return runStandaloneOp("convertScaleAbs", inputPath, outputPath, alpha, beta);
}

/**
 * Standalone wrapper for `lut`: per-pixel intensity remap (`cv::LUT`). `map` is
 * a function `(x) => y` evaluated over `x = 0..255` or a 256-entry output table.
 */
export function lut(
  inputPath: string,
  outputPath: string,
  map: LutMap,
): Promise<string> {
  return runStandaloneOp("lut", inputPath, outputPath, map);
}

/**
 * Standalone wrapper for `sobel`: directional edge derivative (`cv::Sobel`),
 * returned as an absolute 8-bit image.
 */
export function sobel(
  inputPath: string,
  outputPath: string,
  dx: number,
  dy: number,
  ksize?: number,
  scale?: number,
  delta?: number,
): Promise<string> {
  return runStandaloneOp(
    "sobel",
    inputPath,
    outputPath,
    dx,
    dy,
    ksize,
    scale,
    delta,
  );
}

/**
 * Standalone wrapper for `scharr`: 3×3 first-order edge derivative
 * (`cv::Scharr`), returned as an absolute 8-bit image.
 */
export function scharr(
  inputPath: string,
  outputPath: string,
  dx: number,
  dy: number,
  scale?: number,
  delta?: number,
): Promise<string> {
  return runStandaloneOp("scharr", inputPath, outputPath, dx, dy, scale, delta);
}

/**
 * Standalone wrapper for `laplacian`: isotropic second-derivative edge detector
 * (`cv::Laplacian`), returned as an absolute 8-bit image.
 */
export function laplacian(
  inputPath: string,
  outputPath: string,
  ksize?: number,
  scale?: number,
  delta?: number,
): Promise<string> {
  return runStandaloneOp(
    "laplacian",
    inputPath,
    outputPath,
    ksize,
    scale,
    delta,
  );
}

/**
 * Standalone wrapper for `sepFilter2D`: separable convolution with 1D row and
 * column kernels (`cv::sepFilter2D`).
 */
export function sepFilter2D(
  inputPath: string,
  outputPath: string,
  kernelX: Kernel1D,
  kernelY: Kernel1D,
  delta?: number,
): Promise<string> {
  return runStandaloneOp(
    "sepFilter2D",
    inputPath,
    outputPath,
    kernelX,
    kernelY,
    delta,
  );
}
