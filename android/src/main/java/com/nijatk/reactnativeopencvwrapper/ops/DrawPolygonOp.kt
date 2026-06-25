package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint
import org.opencv.core.Point
import org.opencv.core.Scalar
import org.opencv.imgproc.Imgproc

/**
 * Draw a polyline/polygon through the given points onto a copy of the current
 * image. Useful for outlining detection quads (e.g. `detectDocument` corners).
 */
object DrawPolygonOp : Op {
  override val name = "drawPolygon"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val pointsJson = params.optJSONArray("points")
      ?: invalidArg("drawPolygon 'points' must have at least 2 points")
    if (pointsJson.length() < 2) invalidArg("drawPolygon 'points' must have at least 2 points")
    val thickness = params.getInt("thickness")
    if (thickness < 1) invalidArg("drawPolygon 'thickness' must be >= 1")
    val pts = ArrayList<Point>(pointsJson.length())
    for (i in 0 until pointsJson.length()) {
      val pair = pointsJson.optJSONArray(i)
      if (pair == null || pair.length() < 2) {
        invalidArg("drawPolygon points must be [x, y] number pairs")
      }
      pts.add(Point(pair.getDouble(0), pair.getDouble(1)))
    }
    val closed = params.optBoolean("closed", true)
    val color = OpSupport.colorScalar(params.optJSONArray("color"), Scalar(0.0, 0.0, 255.0))
    val lineType = OpSupport.lineType(params)
    val dst = current.clone()
    val contour = MatOfPoint().apply { fromList(pts) }
    val fillArr = params.optJSONArray("fillColor")
    if (fillArr != null) {
      val fillColor = OpSupport.colorScalar(fillArr, color)
      Imgproc.fillPoly(dst, listOf(contour), fillColor, lineType, 0, Point(0.0, 0.0))
    }
    Imgproc.polylines(dst, listOf(contour), closed, color, thickness, lineType)
    contour.release()
    return dst
  }
}
