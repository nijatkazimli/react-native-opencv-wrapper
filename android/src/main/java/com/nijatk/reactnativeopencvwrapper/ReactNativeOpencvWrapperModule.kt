package com.nijatk.reactnativeopencvwrapper

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.opencv.android.OpenCVLoader
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgcodecs.Imgcodecs
import org.opencv.imgproc.Imgproc

class ReactNativeOpencvWrapperModule(reactContext: ReactApplicationContext) :
  NativeReactNativeOpencvWrapperSpec(reactContext) {

  init {
    // OpenCVLoader.initLocal() statically links the bundled native library
    // shipped inside the OpenCV Android AAR. Failures will surface in op
    // calls rather than crashing module construction.
    runCatching { OpenCVLoader.initLocal() }
  }

  override fun getOpenCVVersion(): String = Core.VERSION

  override fun toGray(inputPath: String, outputPath: String, promise: Promise) {
    runOp(promise, outputPath) {
      val src = readOrThrow(inputPath, Imgcodecs.IMREAD_COLOR)
      val dst = Mat()
      Imgproc.cvtColor(src, dst, Imgproc.COLOR_BGR2GRAY)
      writeOrThrow(outputPath, dst)
      src.release(); dst.release()
    }
  }

  override fun gaussianBlur(
    inputPath: String,
    outputPath: String,
    kernelSize: Double,
    sigmaX: Double,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      val k = kernelSize.toInt()
      require(k >= 1 && k % 2 == 1) { "kernelSize must be a positive odd integer" }
      val src = readOrThrow(inputPath, Imgcodecs.IMREAD_COLOR)
      val dst = Mat()
      Imgproc.GaussianBlur(src, dst, Size(k.toDouble(), k.toDouble()), sigmaX)
      writeOrThrow(outputPath, dst)
      src.release(); dst.release()
    }
  }

  override fun canny(
    inputPath: String,
    outputPath: String,
    threshold1: Double,
    threshold2: Double,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      val src = readOrThrow(inputPath, Imgcodecs.IMREAD_GRAYSCALE)
      val dst = Mat()
      Imgproc.Canny(src, dst, threshold1, threshold2)
      writeOrThrow(outputPath, dst)
      src.release(); dst.release()
    }
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private inline fun runOp(promise: Promise, outputPath: String, block: () -> Unit) {
    try {
      block()
      promise.resolve(outputPath)
    } catch (t: Throwable) {
      promise.reject("opencv_error", t.message ?: t.javaClass.simpleName, t)
    }
  }

  private fun readOrThrow(path: String, flag: Int): Mat {
    val m = Imgcodecs.imread(path, flag)
    if (m.empty()) error("Could not read image at $path")
    return m
  }

  private fun writeOrThrow(path: String, mat: Mat) {
    if (!Imgcodecs.imwrite(path, mat)) error("Could not write image to $path")
  }

  companion object {
    const val NAME = NativeReactNativeOpencvWrapperSpec.NAME
  }
}
