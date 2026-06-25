package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/** Draw a circle outline onto a copy of the current image. */
object DrawCircleOp : Op {
  override val name = "drawCircle"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val radius = params.getInt("radius")
    if (radius <= 0) invalidArg("drawCircle 'radius' must be positive")
    val thickness = params.getInt("thickness")
    if (thickness < 1) invalidArg("drawCircle 'thickness' must be >= 1")
    val centerX = params.getInt("centerX")
    val centerY = params.getInt("centerY")
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 255.0))
    val lineType = OpSupport.lineType(params)
    val dst = current.clone()
    val center = Point(centerX.toDouble(), centerY.toDouble())
    val fillArr = params.optJSONArray("fillColor")
    if (fillArr != null) {
      val fillColor = OpSupport.colorScalar(fillArr, color)
      Imgproc.circle(dst, center, radius, fillColor, Imgproc.FILLED, lineType)
    }
    Imgproc.circle(dst, center, radius, color, thickness, lineType)
    return dst
  }
}
