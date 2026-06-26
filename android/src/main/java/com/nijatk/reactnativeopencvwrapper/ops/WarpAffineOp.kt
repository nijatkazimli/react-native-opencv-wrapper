package com.nijatk.reactnativeopencvwrapper.ops

import org.json.JSONArray
import org.json.JSONObject
import org.opencv.core.Mat
import org.opencv.core.MatOfPoint2f
import org.opencv.core.Point
import org.opencv.core.Size
import org.opencv.imgproc.Imgproc

/**
 * Map three source points onto three destination points (affine warp), which
 * covers rotation, scaling, shear and translation. `width`/`height` default to
 * the current image size.
 */
object WarpAffineOp : Op {
  override val name = "warpAffine"
  override fun apply(current: Mat, params: JSONObject): Mat {
    val src = parsePoints(params, "srcPoints", 3)
    val dst = parsePoints(params, "dstPoints", 3)
    val width = if (params.has("width")) params.getInt("width") else current.cols()
    val height = if (params.has("height")) params.getInt("height") else current.rows()
    if (width <= 0 || height <= 0) invalidArg("warpAffine width and height must be positive")
    val transform = Imgproc.getAffineTransform(src, dst)
    src.release()
    dst.release()
    return Mat().also {
      Imgproc.warpAffine(current, it, transform, Size(width.toDouble(), height.toDouble()))
      transform.release()
    }
  }

  private fun parsePoints(params: JSONObject, key: String, count: Int): MatOfPoint2f {
    val arr: JSONArray = params.optJSONArray(key)
      ?: invalidArg("'$key' must be an array of $count [x, y] points")
    if (arr.length() != count) invalidArg("'$key' must be an array of $count [x, y] points")
    val pts = ArrayList<Point>(count)
    for (i in 0 until arr.length()) {
      val pair = arr.optJSONArray(i)
      if (pair == null || pair.length() < 2) invalidArg("'$key' points must be [x, y] number pairs")
      pts.add(Point(pair.getDouble(0), pair.getDouble(1)))
    }
    return MatOfPoint2f().apply { fromList(pts) }
  }
}
