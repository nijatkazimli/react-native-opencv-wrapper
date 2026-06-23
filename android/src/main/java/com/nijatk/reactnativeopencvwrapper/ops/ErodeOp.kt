package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

object ErodeOp : Op {
  override val name = "erode"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val k = params.getInt("kernelSize")
    val iterations = params.optInt("iterations", 1).coerceAtLeast(1)
    OpSupport.requireOdd(k)
    val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(k.toDouble(), k.toDouble()))
    val dst = Mat().also { Imgproc.erode(current, it, kernel, Point(-1.0, -1.0), iterations) }
    kernel.release()
    return dst
  }
}
