package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

/**
 * Contrast-limited adaptive histogram equalization. The image is grayscaled
 * first, so the result is single-channel. `tileGridSize` is the side length of
 * the square grid of tiles equalized independently.
 */
object ClaheOp : Op {
  override val name = "clahe"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val clipLimit = if (params.has("clipLimit")) params.getDouble("clipLimit") else 2.0
    val tile = if (params.has("tileGridSize")) params.getInt("tileGridSize") else 8
    if (clipLimit <= 0 || tile < 1) {
      invalidArg("clahe clipLimit must be > 0 and tileGridSize >= 1")
    }
    val gray = OpSupport.ensureGray(current)
    val clahe = Imgproc.createCLAHE(clipLimit, Size(tile.toDouble(), tile.toDouble()))
    val dst = Mat()
    clahe.apply(gray, dst)
    if (gray !== current) gray.release()
    return dst
  }
}
