package com.nijatk.reactnativeopencvwrapper.ops

import android.util.Base64
import org.opencv.core.Mat
import org.opencv.core.MatOfByte
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
}
