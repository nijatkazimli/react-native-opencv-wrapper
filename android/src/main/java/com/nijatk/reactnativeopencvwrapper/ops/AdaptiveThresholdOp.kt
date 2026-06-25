package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object AdaptiveThresholdOp : Op {
  override val name = "adaptiveThreshold"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val maxValue = params.getDouble("maxValue")
    val blockSize = params.getInt("blockSize")
    val c = params.getDouble("c")
    if (blockSize < 3 || blockSize % 2 == 0) {
      invalidArg("adaptiveThreshold 'blockSize' must be an odd integer >= 3")
    }
    val method = adaptiveMethod(params.optString("method"))
    val thresholdType = thresholdType(params.optString("thresholdType"))
    val gray = OpSupport.ensureGray(current)
    val dst = Mat()
    Imgproc.adaptiveThreshold(gray, dst, maxValue, method, thresholdType, blockSize, c)
    if (gray !== current) gray.release()
    return dst
  }

  private fun adaptiveMethod(name: String?): Int = when (name) {
    "mean" -> Imgproc.ADAPTIVE_THRESH_MEAN_C
    "gaussian" -> Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C
    else -> invalidArg("adaptiveThreshold 'method' must be 'mean' or 'gaussian'")
  }

  private fun thresholdType(name: String?): Int = when (name) {
    "binary" -> Imgproc.THRESH_BINARY
    "binaryInv" -> Imgproc.THRESH_BINARY_INV
    else -> invalidArg("adaptiveThreshold 'thresholdType' must be 'binary' or 'binaryInv'")
  }
}
