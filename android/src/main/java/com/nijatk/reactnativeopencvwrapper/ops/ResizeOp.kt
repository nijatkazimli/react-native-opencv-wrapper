package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

object ResizeOp : Op {
  override val name = "resize"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val w = params.getInt("width")
    val h = params.getInt("height")
    require(w >= 1 && h >= 1) { "resize width/height must be positive" }
    return Mat().also {
      Imgproc.resize(
        current, it, Size(w.toDouble(), h.toDouble()), 0.0, 0.0,
        interpolationFlag(params.optString("interpolation")),
      )
    }
  }

  private fun interpolationFlag(name: String?): Int = when (name) {
    "nearest" -> Imgproc.INTER_NEAREST
    "cubic" -> Imgproc.INTER_CUBIC
    "area" -> Imgproc.INTER_AREA
    else -> Imgproc.INTER_LINEAR
  }
}
