package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

object CannyOp : Op {
  override val name = "canny"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val t1 = params.getDouble("threshold1")
    val t2 = params.getDouble("threshold2")
    val gray = OpSupport.ensureGray(current)
    val dst = Mat().also { Imgproc.Canny(gray, it, t1, t2) }
    if (gray !== current) gray.release()
    return dst
  }
}
