package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object ThresholdOp : Op {
  override val name = "threshold"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val thresh = params.getDouble("thresh")
    val maxValue = params.getDouble("maxValue")
    return Mat().also {
      Imgproc.threshold(current, it, thresh, maxValue, thresholdFlag(params.optString("thresholdType")))
    }
  }

  private fun thresholdFlag(name: String?): Int = when (name) {
    "binaryInv" -> Imgproc.THRESH_BINARY_INV
    "trunc" -> Imgproc.THRESH_TRUNC
    "toZero" -> Imgproc.THRESH_TOZERO
    "toZeroInv" -> Imgproc.THRESH_TOZERO_INV
    else -> Imgproc.THRESH_BINARY
  }
}
