package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/** Draw a straight line segment onto a copy of the current image. */
object DrawLineOp : Op {
  override val name = "drawLine"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val thickness = params.getInt("thickness")
    if (thickness < 1) invalidArg("drawLine 'thickness' must be >= 1")
    val x1 = params.getInt("x1")
    val y1 = params.getInt("y1")
    val x2 = params.getInt("x2")
    val y2 = params.getInt("y2")
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 255.0))
    val lineType = OpSupport.lineType(params)
    val dst = current.clone()
    Imgproc.line(
      dst,
      Point(x1.toDouble(), y1.toDouble()),
      Point(x2.toDouble(), y2.toDouble()),
      color,
      thickness,
      lineType,
    )
    return dst
  }
}
