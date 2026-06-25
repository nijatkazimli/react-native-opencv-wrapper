package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Rect
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/** Draw a rectangle outline onto a copy of the current image. */
object DrawRectOp : Op {
  override val name = "drawRect"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val width = params.getInt("width")
    val height = params.getInt("height")
    if (width <= 0 || height <= 0) invalidArg("drawRect 'width' and 'height' must be positive")
    val thickness = params.getInt("thickness")
    if (thickness < 1) invalidArg("drawRect 'thickness' must be >= 1")
    val x = params.getInt("x")
    val y = params.getInt("y")
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 255.0))
    val lineType = OpSupport.lineType(params)
    val dst = current.clone()
    val rect = Rect(x, y, width, height)
    val fillArr = params.optJSONArray("fillColor")
    if (fillArr != null) {
      val fillColor = OpSupport.colorScalar(fillArr, color)
      Imgproc.rectangle(dst, rect, fillColor, Imgproc.FILLED, lineType)
    }
    Imgproc.rectangle(dst, rect, color, thickness, lineType)
    return dst
  }
}
