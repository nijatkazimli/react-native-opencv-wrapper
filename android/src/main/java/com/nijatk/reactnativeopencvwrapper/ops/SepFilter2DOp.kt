package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.imgproc.Imgproc

/**
 * Separable convolution (`Imgproc.sepFilter2D`): applies the 1D `kernelX` across
 * rows and `kernelY` down columns. Keeps the source depth/channels like
 * `filter2D`.
 */
object SepFilter2DOp : Op {
  override val name = "sepFilter2D"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val kernelX = parseKernel(params, "kernelX")
    val kernelY = parseKernel(params, "kernelY")
    val delta = if (params.has("delta")) params.getDouble("delta") else 0.0
    return Mat().also {
      Imgproc.sepFilter2D(current, it, -1, kernelX, kernelY, Point(-1.0, -1.0), delta)
      kernelX.release()
      kernelY.release()
    }
  }

  private fun parseKernel(params: JSONObject, key: String): Mat {
    val values: JSONArray = params.optJSONArray(key)
      ?: invalidArg("sepFilter2D '$key' must be a non-empty array of numbers")
    if (values.length() == 0) {
      invalidArg("sepFilter2D '$key' must be a non-empty array of numbers")
    }
    val kernel = Mat(values.length(), 1, CvType.CV_64F)
    for (i in 0 until values.length()) kernel.put(i, 0, values.getDouble(i))
    return kernel
  }
}
