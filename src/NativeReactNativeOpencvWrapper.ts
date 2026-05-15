import { TurboModuleRegistry, type TurboModule } from "react-native";

export interface Spec extends TurboModule {
  /** OpenCV runtime version string (e.g. "4.10.0"). */
  getOpenCVVersion(): string;

  /**
   * Convert the input image to a single-channel grayscale image and write it
   * to `outputPath`. Resolves with the absolute output path.
   */
  toGray(inputPath: string, outputPath: string): Promise<string>;

  /**
   * Apply a Gaussian blur. `kernelSize` must be a positive odd integer.
   * `sigmaX` of 0 lets OpenCV derive sigma from the kernel size.
   */
  gaussianBlur(
    inputPath: string,
    outputPath: string,
    kernelSize: number,
    sigmaX: number,
  ): Promise<string>;

  /**
   * Run the Canny edge detector. `threshold1` is the lower hysteresis
   * threshold; `threshold2` is the upper one.
   */
  canny(
    inputPath: string,
    outputPath: string,
    threshold1: number,
    threshold2: number,
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  "ReactNativeOpencvWrapper",
);
