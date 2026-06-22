package com.nijatk.reactnativeopencvwrapper

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import org.json.JSONArray
import org.json.JSONObject
import org.opencv.android.OpenCVLoader
import org.opencv.core.Core
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Rect
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

  override fun runPipeline(
    inputPath: String,
    outputPath: String,
    opsJson: String,
    promise: Promise
  ) {
    runOp(promise, outputPath) {
      val ops = JSONArray(opsJson)
      var current = readOrThrow(inputPath, Imgcodecs.IMREAD_COLOR)
      try {
        for (i in 0 until ops.length()) {
          val op = ops.getJSONObject(i)
          val type = op.getString("type")
          val handler = PIPELINE_OPS[type] ?: error("Unknown pipeline op type '$type'")
          val next = handler(current, op)
          if (next !== current) current.release()
          current = next
        }
        writeOrThrow(outputPath, current)
      } finally {
        current.release()
      }
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

    /**
     * A pipeline op transforms the current `Mat` into the next one, using
     * parameters from the op's JSON object. Returning the same `Mat`
     * indicates a no-op (caller skips releasing it).
     *
     * To add a new op, append an entry to [PIPELINE_OPS] below.
     */
    private fun ensureGray(src: Mat): Mat {
      if (src.channels() == 1) return src
      val gray = Mat()
      Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY)
      return gray
    }

    private fun requireOdd(k: Int) =
      require(k >= 1 && k % 2 == 1) { "kernelSize must be a positive odd integer" }

    private fun interpolationFlag(name: String?): Int = when (name) {
      "nearest" -> Imgproc.INTER_NEAREST
      "cubic" -> Imgproc.INTER_CUBIC
      "area" -> Imgproc.INTER_AREA
      else -> Imgproc.INTER_LINEAR
    }

    private fun thresholdFlag(name: String?): Int = when (name) {
      "binaryInv" -> Imgproc.THRESH_BINARY_INV
      "trunc" -> Imgproc.THRESH_TRUNC
      "toZero" -> Imgproc.THRESH_TOZERO
      "toZeroInv" -> Imgproc.THRESH_TOZERO_INV
      else -> Imgproc.THRESH_BINARY
    }

    private val PIPELINE_OPS: Map<String, (Mat, JSONObject) -> Mat> = mapOf(
      "gray" to { current, _ -> ensureGray(current) },
      "gaussianBlur" to { current, params ->
        val k = params.getInt("kernelSize")
        val sigmaX = params.optDouble("sigmaX", 0.0)
        requireOdd(k)
        Mat().also { Imgproc.GaussianBlur(current, it, Size(k.toDouble(), k.toDouble()), sigmaX) }
      },
      "canny" to { current, params ->
        val t1 = params.getDouble("threshold1")
        val t2 = params.getDouble("threshold2")
        val gray = ensureGray(current)
        val dst = Mat().also { Imgproc.Canny(gray, it, t1, t2) }
        if (gray !== current) gray.release()
        dst
      },
      "resize" to { current, params ->
        val w = params.getInt("width")
        val h = params.getInt("height")
        require(w >= 1 && h >= 1) { "resize width/height must be positive" }
        Mat().also {
          Imgproc.resize(
            current, it, Size(w.toDouble(), h.toDouble()), 0.0, 0.0,
            interpolationFlag(params.optString("interpolation")),
          )
        }
      },
      "crop" to { current, params ->
        val x = params.getInt("x")
        val y = params.getInt("y")
        val w = params.getInt("width")
        val h = params.getInt("height")
        require(x >= 0 && y >= 0 && w >= 1 && h >= 1 &&
          x + w <= current.cols() && y + h <= current.rows()) {
          "crop rectangle is out of image bounds"
        }
        // submat is a view; clone so the result owns its own data.
        Mat(current, Rect(x, y, w, h)).clone()
      },
      "rotate" to { current, params ->
        val code = when (params.getInt("angle")) {
          90 -> Core.ROTATE_90_CLOCKWISE
          180 -> Core.ROTATE_180
          270 -> Core.ROTATE_90_COUNTERCLOCKWISE
          else -> error("rotate angle must be 90, 180 or 270")
        }
        Mat().also { Core.rotate(current, it, code) }
      },
      "flip" to { current, params ->
        val code = when (params.getString("direction")) {
          "horizontal" -> 1
          "vertical" -> 0
          "both" -> -1
          else -> error("flip direction must be horizontal, vertical or both")
        }
        Mat().also { Core.flip(current, it, code) }
      },
      "threshold" to { current, params ->
        val thresh = params.getDouble("thresh")
        val maxValue = params.getDouble("maxValue")
        Mat().also {
          Imgproc.threshold(current, it, thresh, maxValue, thresholdFlag(params.optString("thresholdType")))
        }
      },
      "medianBlur" to { current, params ->
        val k = params.getInt("kernelSize")
        requireOdd(k)
        Mat().also { Imgproc.medianBlur(current, it, k) }
      },
      "dilate" to { current, params ->
        val k = params.getInt("kernelSize")
        val iterations = params.optInt("iterations", 1).coerceAtLeast(1)
        requireOdd(k)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(k.toDouble(), k.toDouble()))
        val dst = Mat().also { Imgproc.dilate(current, it, kernel, Point(-1.0, -1.0), iterations) }
        kernel.release()
        dst
      },
      "erode" to { current, params ->
        val k = params.getInt("kernelSize")
        val iterations = params.optInt("iterations", 1).coerceAtLeast(1)
        requireOdd(k)
        val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(k.toDouble(), k.toDouble()))
        val dst = Mat().also { Imgproc.erode(current, it, kernel, Point(-1.0, -1.0), iterations) }
        kernel.release()
        dst
      },
    )
  }
}
