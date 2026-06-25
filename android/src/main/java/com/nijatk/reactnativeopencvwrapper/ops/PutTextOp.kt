package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/** Draw a text label onto a copy of the current image (Hershey simplex font). */
object PutTextOp : Op {
  override val name = "putText"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val text = params.optString("text")
    if (text.isEmpty()) invalidArg("putText 'text' must be a non-empty string")
    val fontScale = params.getDouble("fontScale")
    if (fontScale <= 0) invalidArg("putText 'fontScale' must be positive")
    val thickness = params.getInt("thickness")
    if (thickness < 1) invalidArg("putText 'thickness' must be >= 1")
    val x = params.getInt("x")
    val y = params.getInt("y")
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 255.0))
    val lineType = OpSupport.lineType(params)
    val dst = current.clone()
    Imgproc.putText(
      dst,
      text,
      Point(x.toDouble(), y.toDouble()),
      Imgproc.FONT_HERSHEY_SIMPLEX,
      fontScale,
      color,
      thickness,
      lineType,
    )
    return dst
  }
}
