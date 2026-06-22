import NativeOpenCV from "./NativeReactNativeOpencvWrapper";

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

/** Interpolation modes accepted by {@link Pipeline.resize}. */
export type Interpolation = "nearest" | "linear" | "cubic" | "area";
/** Flip directions accepted by {@link Pipeline.flip}. */
export type FlipDirection = "horizontal" | "vertical" | "both";
/** Thresholding modes accepted by {@link Pipeline.threshold}. */
export type ThresholdType =
  | "binary"
  | "binaryInv"
  | "trunc"
  | "toZero"
  | "toZeroInv";
/** Clockwise rotation angles accepted by {@link Pipeline.rotate}. */
export type RotateAngle = 90 | 180 | 270;

/** Serialized form of a single pipeline step sent to the native side. */
type PipelineOp =
  | { type: "gray" }
  | { type: "gaussianBlur"; kernelSize: number; sigmaX: number }
  | { type: "canny"; threshold1: number; threshold2: number }
  | {
      type: "resize";
      width: number;
      height: number;
      interpolation: Interpolation;
    }
  | { type: "crop"; x: number; y: number; width: number; height: number }
  | { type: "rotate"; angle: RotateAngle }
  | { type: "flip"; direction: FlipDirection }
  | {
      type: "threshold";
      thresh: number;
      maxValue: number;
      thresholdType: ThresholdType;
    }
  | { type: "medianBlur"; kernelSize: number }
  | { type: "dilate"; kernelSize: number; iterations: number }
  | { type: "erode"; kernelSize: number; iterations: number };

// ---------------------------------------------------------------------------
// Phantom state markers (internal)
// ---------------------------------------------------------------------------
//
// These are string literal types (instead of true/false) so that when the
// type-system catches a missing setter the TypeScript error literally
// mentions e.g. `"missing-input"` / `"missing-output"`, telling the user
// what to fix instead of just `Pipeline<false, false>`.
//
// They are deliberately NOT exported — they exist only to spell the
// `Pipeline` generics and should never be referenced by consumers.

/** @internal */
type InputState = "input-set" | "missing-input";
/** @internal */
type OutputState = "output-set" | "missing-output";

/**
 * A {@link Pipeline} whose `input` and `output` have both been provided —
 * the only receiver shape {@link Pipeline.run} will accept. Used as a
 * self-documenting alias so the TypeScript error on a missing setter
 * reads `... is not assignable to method's 'this' of type 'ReadyPipeline'`
 * instead of an opaque generic instantiation.
 */
export type ReadyPipeline = Pipeline<"input-set", "output-set">;

/**
 * Fluent, type-safe builder for chaining OpenCV operations on a single image.
 *
 * Operations are queued on the JS side and executed natively in a single
 * call: the image is read from disk once, kept in memory as a `cv::Mat`
 * across all steps, and written to `outputPath` once at the end. This
 * avoids the per-step `imread`/`imwrite` overhead of calling the standalone
 * helpers ({@link toGray}, {@link gaussianBlur}, {@link canny}) in sequence.
 *
 * The presence of `input` / `output` is tracked in the type system via the
 * {@link InputState} / {@link OutputState} phantom type parameters, so
 * {@link Pipeline.run} is a **compile-time** error until both have been
 * provided — no runtime "missing path" errors:
 *
 * ```ts
 * pipeline().gray().run();
 * //                ~~~ Error: 'this' context of type
 * //                    Pipeline<"missing-input", "missing-output"> is not
 * //                    assignable to method's 'this' of type ReadyPipeline.
 *
 * pipeline().input("a").gray().run();
 * //                           ~~~ Error: ...Pipeline<"input-set",
 * //                                     "missing-output">...
 *
 * pipeline().input("a").output("b").gray().run(); // ✅ ok
 * ```
 *
 * Instances are not thread-safe and are intended to be built and consumed
 * once. Prefer the {@link pipeline} factory over `new Pipeline()` so the
 * generics start in their `missing-*` state.
 *
 * @typeParam Input  `"input-set"` once {@link Pipeline.input} has been
 *                   called, otherwise `"missing-input"`. Do not set
 *                   explicitly.
 * @typeParam Output `"output-set"` once {@link Pipeline.output} has been
 *                   called, otherwise `"missing-output"`. Do not set
 *                   explicitly.
 *
 * @example Basic edge-detection pipeline
 * ```ts
 * await pipeline()
 *   .input("/tmp/in.jpg")
 *   .output("/tmp/out.jpg")
 *   .gray()
 *   .gaussianBlur(5)
 *   .canny(50, 150)
 *   .run();
 * ```
 *
 * @example Setters are order-independent
 * ```ts
 * await pipeline()
 *   .gaussianBlur(3)
 *   .output("/tmp/out.jpg")
 *   .input("/tmp/in.jpg")
 *   .run();
 * ```
 */
/**
 * Phantom shape merged into {@link Pipeline} so that `Input`/`Output`
 * actually participate in the class's structural type. Without this, the
 * generics appear only in method signatures and TypeScript treats
 * `Pipeline<"missing-input", "missing-output">` and
 * `Pipeline<"input-set", "output-set">` as identical types, which defeats
 * the `this:` constraint on {@link Pipeline.run}.
 *
 * The property is optional and never assigned at runtime — it exists purely
 * in the type system.
 */
export interface Pipeline<
  Input extends InputState = "missing-input",
  Output extends OutputState = "missing-output",
> {
  readonly __state?: [Input, Output];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Pipeline<
  Input extends InputState = "missing-input",
  Output extends OutputState = "missing-output",
> {
  private _input?: string;
  private _output?: string;
  private readonly ops: PipelineOp[] = [];

  /**
   * Set the absolute path of the source image.
   *
   * Must be a filesystem path readable by `cv::imread` (jpg, png, bmp, ...).
   * The `file://` URI scheme is **not** supported — strip it before calling.
   *
   * Calling this flips `Input` to `"input-set"` in the returned type, one
   * of the two preconditions for {@link Pipeline.run}.
   *
   * @param path Absolute filesystem path to the source image.
   * @returns The same builder, now typed as having an input set.
   */
  input(path: string): Pipeline<"input-set", Output> {
    this._input = path;
    return this as unknown as Pipeline<"input-set", Output>;
  }

  /**
   * Set the absolute path where the final result is written.
   *
   * The destination is written exactly once, after all queued steps run.
   * Format is inferred from the file extension by `cv::imwrite`. Existing
   * files at `path` are overwritten.
   *
   * Calling this flips `Output` to `"output-set"` in the returned type, the
   * second precondition for {@link Pipeline.run}.
   *
   * @param path Absolute filesystem path for the output image.
   * @returns The same builder, now typed as having an output set.
   */
  output(path: string): Pipeline<Input, "output-set"> {
    this._output = path;
    return this as unknown as Pipeline<Input, "output-set">;
  }

  /**
   * Queue a grayscale conversion step (`cv::cvtColor` with `COLOR_BGR2GRAY`).
   *
   * Becomes a no-op if the current in-memory image is already single-channel
   * (e.g. after a previous `gray()` or `canny()`).
   */
  gray(): this {
    this.ops.push({ type: "gray" });
    return this;
  }

  /**
   * Queue a Gaussian blur step (`cv::GaussianBlur`).
   *
   * @param kernelSize Positive odd integer used for both width and height of
   *                   the kernel (e.g. 3, 5, 7). Even or non-positive values
   *                   cause the pipeline to reject at run time.
   * @param sigmaX     Standard deviation in the X direction. Pass `0` (the
   *                   default) to let OpenCV derive it from `kernelSize`.
   */
  gaussianBlur(kernelSize: number, sigmaX: number = 0): this {
    this.ops.push({ type: "gaussianBlur", kernelSize, sigmaX });
    return this;
  }

  /**
   * Queue a Canny edge-detection step (`cv::Canny`). The current image is
   * converted to grayscale in-memory first if needed; the result is a
   * single-channel binary edge map.
   *
   * @param threshold1 Lower hysteresis threshold.
   * @param threshold2 Upper hysteresis threshold.
   */
  canny(threshold1: number, threshold2: number): this {
    this.ops.push({ type: "canny", threshold1, threshold2 });
    return this;
  }

  /**
   * Queue a resize step (`cv::resize`).
   *
   * @param width         Target width in pixels (positive integer).
   * @param height        Target height in pixels (positive integer).
   * @param interpolation Sampling strategy. `"area"` is best for shrinking,
   *                      `"cubic"`/`"linear"` for enlarging. Defaults to
   *                      `"linear"`.
   */
  resize(
    width: number,
    height: number,
    interpolation: Interpolation = "linear",
  ): this {
    this.ops.push({ type: "resize", width, height, interpolation });
    return this;
  }

  /**
   * Queue a crop step to a rectangular region of interest.
   *
   * The rectangle must lie fully within the current image bounds, otherwise
   * the pipeline rejects at run time.
   *
   * @param x      Left edge (px, >= 0).
   * @param y      Top edge (px, >= 0).
   * @param width  Region width (px, > 0).
   * @param height Region height (px, > 0).
   */
  crop(x: number, y: number, width: number, height: number): this {
    this.ops.push({ type: "crop", x, y, width, height });
    return this;
  }

  /**
   * Queue a clockwise rotation by a right angle (`cv::rotate`).
   *
   * @param angle One of `90`, `180`, or `270` degrees clockwise.
   */
  rotate(angle: RotateAngle): this {
    this.ops.push({ type: "rotate", angle });
    return this;
  }

  /**
   * Queue a flip step (`cv::flip`).
   *
   * @param direction `"horizontal"` mirrors left/right, `"vertical"` mirrors
   *                  top/bottom, `"both"` does both (180° point reflection).
   */
  flip(direction: FlipDirection): this {
    this.ops.push({ type: "flip", direction });
    return this;
  }

  /**
   * Queue a fixed-level threshold step (`cv::threshold`).
   *
   * @param thresh        Threshold value pixels are compared against.
   * @param maxValue      Value assigned to pixels that pass (for the binary
   *                      modes).
   * @param thresholdType Comparison mode. Defaults to `"binary"`.
   */
  threshold(
    thresh: number,
    maxValue: number,
    thresholdType: ThresholdType = "binary",
  ): this {
    this.ops.push({ type: "threshold", thresh, maxValue, thresholdType });
    return this;
  }

  /**
   * Queue a median blur step (`cv::medianBlur`), effective for salt-and-pepper
   * noise.
   *
   * @param kernelSize Positive odd integer aperture size (e.g. 3, 5).
   */
  medianBlur(kernelSize: number): this {
    this.ops.push({ type: "medianBlur", kernelSize });
    return this;
  }

  /**
   * Queue a morphological dilation (`cv::dilate`) with a square structuring
   * element.
   *
   * @param kernelSize Positive odd integer side length of the kernel.
   * @param iterations Number of times to apply the operation. Defaults to 1.
   */
  dilate(kernelSize: number, iterations: number = 1): this {
    this.ops.push({ type: "dilate", kernelSize, iterations });
    return this;
  }

  /**
   * Queue a morphological erosion (`cv::erode`) with a square structuring
   * element.
   *
   * @param kernelSize Positive odd integer side length of the kernel.
   * @param iterations Number of times to apply the operation. Defaults to 1.
   */
  erode(kernelSize: number, iterations: number = 1): this {
    this.ops.push({ type: "erode", kernelSize, iterations });
    return this;
  }

  /**
   * Return an independent copy of this pipeline, preserving the current
   * input/output state and queued ops. Useful for branching a common base
   * into several variants without the forks sharing (and mutating) the same
   * op list:
   *
   * ```ts
   * const base = pipeline().input(src).output(dst).gray();
   * const edges = base.clone().canny(50, 150);
   * const blurred = base.clone().gaussianBlur(7);
   * ```
   *
   * @returns A new {@link Pipeline} with the same type state and a deep copy
   *          of the queued ops.
   */
  clone(): Pipeline<Input, Output> {
    const copy = new Pipeline<Input, Output>();
    copy._input = this._input;
    copy._output = this._output;
    copy.ops.push(...this.ops.map((op) => ({ ...op })));
    return copy;
  }

  /**
   * Execute all queued steps natively in a single pass and resolve with the
   * output path.
   *
   * Only callable on a {@link ReadyPipeline} — i.e. once both
   * {@link Pipeline.input} and {@link Pipeline.output} have been set. The
   * `this:` parameter enforces this at compile time, so the TS error on
   * misuse names `ReadyPipeline` and points at whichever `"missing-*"`
   * state is still present.
   *
   * @returns A promise that resolves with the output path on success, or
   *          rejects with an `opencv_error` if no steps were queued, an op's
   *          parameters are invalid, the input cannot be read, or the output
   *          cannot be written.
   */
  run(this: ReadyPipeline): Promise<string> {
    if (this.ops.length === 0) {
      return Promise.reject(new Error("Pipeline: no steps queued"));
    }
    return NativeOpenCV.runPipeline(
      this._input!,
      this._output!,
      JSON.stringify(this.ops),
    );
  }
}

/** Create a new {@link Pipeline} for chaining OpenCV operations. */
export function pipeline(): Pipeline {
  return new Pipeline();
}
