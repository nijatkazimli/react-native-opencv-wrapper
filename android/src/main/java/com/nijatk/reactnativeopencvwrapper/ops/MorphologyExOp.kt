package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

object MorphologyExOp : Op {
  override val name = "morphologyEx"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val k = params.getInt("kernelSize")
    val iterations = params.optInt("iterations", 1).coerceAtLeast(1)
    OpSupport.requireOdd(k)
    val operation = morphOp(params.optString("operation"))
    val kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, Size(k.toDouble(), k.toDouble()))
    val dst = Mat().also {
      Imgproc.morphologyEx(current, it, operation, kernel, Point(-1.0, -1.0), iterations)
    }
    kernel.release()
    return dst
  }

  private fun morphOp(name: String?): Int = when (name) {
    "open" -> Imgproc.MORPH_OPEN
    "close" -> Imgproc.MORPH_CLOSE
    "gradient" -> Imgproc.MORPH_GRADIENT
    "tophat" -> Imgproc.MORPH_TOPHAT
    "blackhat" -> Imgproc.MORPH_BLACKHAT
    else -> invalidArg("morphologyEx 'operation' is not supported")
  }
}
