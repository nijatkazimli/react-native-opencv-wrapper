import NativeOpenCV from './NativeReactNativeOpencvWrapper';

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
  sigmaX: number = 0
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
  threshold2: number
): Promise<string> {
  return NativeOpenCV.canny(inputPath, outputPath, threshold1, threshold2);
}
