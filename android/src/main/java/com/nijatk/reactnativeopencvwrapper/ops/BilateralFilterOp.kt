package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Edge-preserving smoothing. `diameter` is the pixel neighbourhood diameter;
 * `sigmaColor`/`sigmaSpace` control how much colour and distance differences
 * are mixed. Writes to a separate destination (in-place is not supported).
 */
object BilateralFilterOp : Op {
  override val name = "bilateralFilter"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val diameter = if (params.has("diameter")) params.getInt("diameter") else 9
    val sigmaColor = if (params.has("sigmaColor")) params.getDouble("sigmaColor") else 75.0
    val sigmaSpace = if (params.has("sigmaSpace")) params.getDouble("sigmaSpace") else 75.0
    if (diameter < 1) invalidArg("bilateralFilter diameter must be >= 1")
    return Mat().also {
      Imgproc.bilateralFilter(current, it, diameter, sigmaColor, sigmaSpace)
    }
  }
}
