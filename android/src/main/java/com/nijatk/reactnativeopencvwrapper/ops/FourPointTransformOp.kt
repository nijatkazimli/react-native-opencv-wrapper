package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

/**
 * Deskew/flatten a quadrilateral region to a straight rectangle by mapping the
 * four source points onto the corners of a width x height output
 * (`getPerspectiveTransform` + `warpPerspective`).
 */
object FourPointTransformOp : Op {
  override val name = "fourPointTransform"

  override fun apply(current: Mat, params: JSONObject): Mat {
    val pts = params.optJSONArray("points")
    if (pts == null || pts.length() < 4) {
      invalidArg("fourPointTransform 'points' must be four [x, y] pairs")
    }
    val src = ArrayList<Point>(4)
    for (i in 0 until 4) {
      val p = pts.getJSONArray(i)
      src.add(Point(p.getDouble(0), p.getDouble(1)))
    }
    val width = if (params.has("width")) params.getInt("width") else current.cols()
    val height = if (params.has("height")) params.getInt("height") else current.rows()
    if (width <= 0 || height <= 0) {
      invalidArg("fourPointTransform 'width'/'height' must be > 0")
    }

    val srcMat = MatOfPoint2f(*src.toTypedArray())
    val dstMat = MatOfPoint2f(
      Point(0.0, 0.0),
      Point((width - 1).toDouble(), 0.0),
      Point((width - 1).toDouble(), (height - 1).toDouble()),
      Point(0.0, (height - 1).toDouble()),
    )
    val transform = Imgproc.getPerspectiveTransform(srcMat, dstMat)
    val out = Mat()
    Imgproc.warpPerspective(current, out, transform, Size(width.toDouble(), height.toDouble()))

    srcMat.release()
    dstMat.release()
    transform.release()
    return out
  }
}
