package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object MedianBlurOp : Op {
  override val name = "medianBlur"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val k = params.getInt("kernelSize")
    OpSupport.requireOdd(k)
    return Mat().also { Imgproc.medianBlur(current, it, k) }
  }
}
