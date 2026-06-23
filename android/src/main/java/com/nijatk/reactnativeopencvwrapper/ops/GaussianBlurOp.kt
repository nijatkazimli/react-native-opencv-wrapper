package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

object GaussianBlurOp : Op {
  override val name = "gaussianBlur"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val k = params.getInt("kernelSize")
    val sigmaX = params.optDouble("sigmaX", 0.0)
    OpSupport.requireOdd(k)
    return Mat().also {
      Imgproc.GaussianBlur(current, it, Size(k.toDouble(), k.toDouble()), sigmaX)
    }
  }
}
