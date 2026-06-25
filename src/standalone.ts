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
