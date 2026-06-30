package com.nijatk.reactnativeopencvwrapper.ops

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.MatOfByte
import org.opencv.core.Scalar
import org.opencv.core.TermCriteria
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

  /**
   * Convert a JS `[r, g, b]` color array (each 0–255) to a BGR [Scalar] for
   * drawing ops. Returns `fallback` when the value is missing or malformed.
   */
  fun colorScalar(arr: JSONArray?, fallback: Scalar): Scalar {
    if (arr == null || arr.length() < 3) return fallback
    return Scalar(arr.getDouble(2), arr.getDouble(1), arr.getDouble(0))
  }

  /**
   * Line type for a drawing op, honoring the optional `antialias` param
   * (default `true` -> [Imgproc.LINE_AA]; `false` -> [Imgproc.LINE_8]).
   */
  fun lineType(params: JSONObject): Int =
    if (params.optBoolean("antialias", true)) Imgproc.LINE_AA else Imgproc.LINE_8

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

  /**
   * Decode a base64-encoded image (with an optional `data:` URI prefix) into a
   * [Mat], or throw if it cannot be decoded.
   */
  fun decodeBase64OrThrow(data: String, flag: Int): Mat {
    val payload = data.substringAfter("base64,", data)
    val bytes = try {
      Base64.decode(payload, Base64.DEFAULT)
    } catch (_: IllegalArgumentException) {
      throw OpenCVIOException("Could not decode base64 input image")
    }
    val encoded = MatOfByte(*bytes)
    val mat = Imgcodecs.imdecode(encoded, flag)
    encoded.release()
    if (mat.empty()) throw OpenCVIOException("Could not decode base64 input image")
    return mat
  }

  /**
   * Decode an image supplied as either a filesystem path (optionally `file://`)
   * or a (data-URI/raw) base64 string. Tries `imread` first, then base64.
   */
  fun decodeImageArg(value: String, flag: Int): Mat {
    val path = if (value.startsWith("file://")) value.substring(7) else value
    val fromPath = Imgcodecs.imread(path, flag)
    if (!fromPath.empty()) return fromPath
    fromPath.release()
    return decodeBase64OrThrow(value, flag)
  }

  /**
   * Encode `mat` to base64 using the encoder selected by `ext` (e.g. `.png`),
   * or throw if it cannot be encoded.
   */
  fun encodeBase64OrThrow(mat: Mat, ext: String): String {
    val buffer = MatOfByte()
    val ok = Imgcodecs.imencode(ext, mat, buffer)
    if (!ok) {
      buffer.release()
      throw OpenCVIOException("Could not encode image as '$ext'")
    }
    val bytes = buffer.toArray()
    buffer.release()
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
  }

  /** Per-pixel labels and cluster centers (3 BGR floats per cluster). */
  class KmeansResult(
    val labels: IntArray,
    val centers: FloatArray,
    val k: Int,
    val sampleCount: Int,
  )

  /**
   * Run k-means over [current]'s pixels in BGR space, reading `k` (default
   * [defaultK]), `attempts` and `iterations` from [params]. Releases every
   * intermediate [Mat] and returns the per-pixel labels plus cluster centers.
   * Throws when `k < 1`.
   */
  fun runKmeansBgr(current: Mat, params: JSONObject, defaultK: Int, opName: String): KmeansResult {
    var k = if (params.has("k")) params.getInt("k") else defaultK
    if (k < 1) invalidArg("$opName 'k' must be >= 1")
    var attempts = if (params.has("attempts")) params.getInt("attempts") else 3
    if (attempts < 1) attempts = 1
    var iterations = if (params.has("iterations")) params.getInt("iterations") else 10
    if (iterations < 1) iterations = 1

    val img = if (current.channels() == 1) {
      Mat().also { Imgproc.cvtColor(current, it, Imgproc.COLOR_GRAY2BGR) }
    } else {
      current
    }
    val sampleCount = img.rows() * img.cols()
    if (k > sampleCount) k = sampleCount

    val data = Mat()
    img.convertTo(data, CvType.CV_32F)
    val reshaped = data.reshape(1, sampleCount)
    val labels = Mat()
    val centers = Mat()
    try {
      val crit = TermCriteria(TermCriteria.EPS + TermCriteria.MAX_ITER, iterations, 1.0)
      Core.kmeans(reshaped, k, labels, crit, attempts, Core.KMEANS_PP_CENTERS, centers)
      val labelData = IntArray(sampleCount)
      labels.get(0, 0, labelData)
      val centerData = FloatArray(k * 3)
      centers.get(0, 0, centerData)
      return KmeansResult(labelData, centerData, k, sampleCount)
    } finally {
      if (img !== current) img.release()
      data.release()
      reshaped.release()
      labels.release()
      centers.release()
    }
  }
}
