package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Core
import org.opencv.core.CvType
import org.opencv.core.Mat
import org.opencv.imgproc.Imgproc

/**
 * Scharr derivative (`Imgproc.Scharr`) — a more accurate 3×3 first-order
 * operator. Exactly one of dx/dy must be 1. Returned as an absolute 8-bit image.
 */
object ScharrOp : Op {
  override val name = "scharr"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val dx = params.getInt("dx")
    val dy = params.getInt("dy")
    val scale = if (params.has("scale")) params.getDouble("scale") else 1.0
    val delta = if (params.has("delta")) params.getDouble("delta") else 0.0
    if (dx < 0 || dy < 0 || dx + dy != 1) {
      invalidArg("scharr requires exactly one of dx/dy to be 1 and the other 0")
    }
    val signedGradient = Mat()
    Imgproc.Scharr(current, signedGradient, CvType.CV_16S, dx, dy, scale, delta)
    return Mat().also {
      Core.convertScaleAbs(signedGradient, it)
      signedGradient.release()
    }
  }
}
