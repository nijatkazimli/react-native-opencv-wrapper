package com.nijatk.reactnativeopencvwrapper.ops

import org.opencv.core.Mat
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc

/** Shared helpers used by ops and the TurboModule's standalone methods. */
object OpSupport {

  /** Return a single-channel copy of `src` (no-op if already grayscale). */
  fun ensureGray(src: Mat): Mat {
    if (src.channels() == 1) return src
    val gray = Mat()
    Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)
    return gray
  }

  /** Require a positive odd kernel size. */
  fun requireOdd(k: Int) =
    require(k >= 1 && k % 2 == 1) { "kernelSize must be a positive odd integer" }

  /** Read an image or throw if it cannot be decoded. */
  fun readOrThrow(path: String, flag: Int): Mat {
    val m = Imgcodecs.imread(path, flag)
    if (m.empty()) throw OpenCVIOException("Could not read image at $path")
    return m
  }

  /** Write an image or throw if it cannot be encoded. */
  fun writeOrThrow(path: String, mat: Mat) {
    if (!Imgcodecs.imwrite(path, mat)) throw OpenCVIOException("Could not write image to $path")
  }
}
